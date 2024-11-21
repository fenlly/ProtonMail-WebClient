import { type FC, type PropsWithChildren, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { useAuthService } from 'proton-pass-web/app/Auth/AuthServiceProvider';
import { checkAuthSwitch, enableAuthSwitch } from 'proton-pass-web/app/Auth/AuthSwitchProvider';
import { useServiceWorker } from 'proton-pass-web/app/ServiceWorker/client/ServiceWorkerProvider';
import { type ServiceWorkerClientMessageHandler } from 'proton-pass-web/app/ServiceWorker/client/client';
import { B2BEvents } from 'proton-pass-web/lib/b2b';
import { deletePassDB, getDBCache, writeDBCache } from 'proton-pass-web/lib/database';
import { getPersistedSessions } from 'proton-pass-web/lib/sessions';
import { settings } from 'proton-pass-web/lib/settings';
import { spotlight } from 'proton-pass-web/lib/spotlight';
import { telemetry } from 'proton-pass-web/lib/telemetry';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { AppStateContext } from '@proton/pass/components/Core/AppStateProvider';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import { themeOptionToDesktop } from '@proton/pass/components/Layout/Theme/types';
import { getLocalPath, removeLocalPath } from '@proton/pass/components/Navigation/routing';
import { useContextProxy } from '@proton/pass/hooks/useContextProxy';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { isDocumentVisible, useVisibleEffect } from '@proton/pass/hooks/useVisibleEffect';
import { api } from '@proton/pass/lib/api/api';
import { authStore } from '@proton/pass/lib/auth/store';
import { clientBooted, clientOffline, clientReady } from '@proton/pass/lib/client';
import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import { setVersionTag } from '@proton/pass/lib/settings/beta';
import { settingsEditIntent, startEventPolling, stopEventPolling } from '@proton/pass/store/actions';
import { cacheGuard } from '@proton/pass/store/migrate';
import { rootSagaFactory } from '@proton/pass/store/sagas';
import { DESKTOP_SAGAS } from '@proton/pass/store/sagas/desktop';
import { WEB_SAGAS } from '@proton/pass/store/sagas/web';
import { selectB2BOnboardingEnabled, selectFeatureFlag, selectLocale } from '@proton/pass/store/selectors';
import { SpotlightMessage } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { prop } from '@proton/pass/utils/fp/lens';
import { semver } from '@proton/pass/utils/string/semver';
import noop from '@proton/utils/noop';

import { sagaMiddleware, store } from './store';

const SAGAS = DESKTOP_BUILD ? [...WEB_SAGAS, ...DESKTOP_SAGAS] : WEB_SAGAS;

export const StoreProvider: FC<PropsWithChildren> = ({ children }) => {
    const core = usePassCore();
    const config = usePassConfig();
    const authService = useAuthService();
    const history = useHistory();
    const { installed } = usePassExtensionLink();
    const online = useConnectivity();

    const app = useContextProxy(AppStateContext);
    const sw = useServiceWorker();
    const { createNotification } = useNotifications();
    const enhance = useNotificationEnhancer();

    useEffect(() => {
        const runner = sagaMiddleware.run(
            rootSagaFactory(SAGAS).bind(null, {
                endpoint: 'web',

                getAppState: () => app.state,
                setAppStatus: app.setStatus,
                getAuthService: () => authService,
                getAuthStore: () => authStore,
                getCache: async () => cacheGuard(await getDBCache(authStore.getUserID()), config.APP_VERSION),
                getPollingInterval: () => ACTIVE_POLLING_TIMEOUT,
                getSettings: () => settings.resolve(authStore.getLocalID()),
                getTelemetry: () => telemetry,
                getDesktopBridge: DESKTOP_BUILD ? () => window.ctxBridge! : undefined,

                onBoot: async (res) => {
                    app.setBooted(res.ok);
                    const userID = authStore.getUserID();
                    const state = store.getState();

                    if (res.ok) {
                        await spotlight.init().catch(noop);

                        telemetry.start().catch(noop);
                        B2BEvents.start().catch(noop);
                        core.i18n.setLocale(selectLocale(state)).catch(noop);

                        /** For desktop builds using cached versions older than 1.24.2:
                         * Auto-acknowledge the `WELCOME` message to prevent showing the
                         * spotlight modal to existing users after they update.  */
                        if (DESKTOP_BUILD && res.version && semver(res.version) < semver('1.24.2')) {
                            spotlight.acknowledge(SpotlightMessage.WELCOME);
                        }

                        if (isDocumentVisible() && !res.offline) store.dispatch(startEventPolling());

                        /* redirect only if initial path is empty */
                        if (!removeLocalPath(history.location.pathname)) {
                            const b2bOnboardingEnabled = selectB2BOnboardingEnabled(installed)(state);
                            const b2bOnboard = await core.spotlight.check(SpotlightMessage.B2B_ONBOARDING);
                            if (b2bOnboardingEnabled && b2bOnboard) history.replace(getLocalPath('onboarding'));
                        }
                    } else if (res.clearCache) void deletePassDB(userID);
                },

                onLocaleUpdated: core.i18n.setLocale,

                onBetaUpdated: async (beta) => {
                    if (BUILD_TARGET === 'web') {
                        const state = store.getState();
                        const forceAlpha = selectFeatureFlag(PassFeature.PassWebInternalAlpha)(state);
                        await api.idle();

                        setVersionTag(beta, forceAlpha);
                        window.location.reload();
                    }
                },

                onNotification: (notification) => {
                    if (notification.type === 'error' && clientOffline(app.state.status)) {
                        notification.errorMessage = c('Warning').t`Offline`;
                    }

                    createNotification(enhance(notification));
                },

                onFeatureFlags: (features) => {
                    /** Account switch feature flag cannot be account specific - first
                     * accounts which gets it enables it for all other sessions */
                    if (!checkAuthSwitch() && features.PassAccountSwitchV1) enableAuthSwitch();
                },

                onSettingsUpdated: async (update) => {
                    void settings.sync(update, authStore.getLocalID());
                    if (DESKTOP_BUILD) {
                        /** Electron might need to apply or store certain settings, forward them */
                        const desktopBridge = window.ctxBridge;
                        const { clipboard, theme } = update;

                        if (theme) desktopBridge?.setTheme(themeOptionToDesktop[theme]).catch(noop);
                        if (clipboard?.timeoutMs) desktopBridge?.setClipboardConfig(clipboard).catch(noop);
                    }
                },

                setCache: async (encryptedCache) => {
                    const userID = authStore.getUserID();
                    if (userID) return writeDBCache(userID, encryptedCache, config.APP_VERSION).catch(noop);
                },
            })
        );

        const handleAction: ServiceWorkerClientMessageHandler<'action'> = ({ action, localID }) => {
            if (clientBooted(app.state.status) && authStore.hasSession(localID)) store.dispatch(action);
        };

        sw?.on('action', handleAction);

        /** When hot-reloading: this `useEffect` can re-trigger,
         * so cancel the on-going saga runner. */
        return () => {
            runner.cancel();
            sw?.off('action', handleAction);
        };
    }, []);

    useEffect(() => {
        /** If the user switched to a new account for the first time, initialize their settings theme
         * to be the current theme (core.theme) which is also the last used account's theme. */
        const setThemeIfMultiAccounts = async () => {
            try {
                if (getPersistedSessions().length > 1 && authStore.getLocalID() && clientReady(app.state.status)) {
                    const settingsTheme = await settings
                        .resolve(authStore.getLocalID())
                        .then(prop('theme'))
                        .catch(noop);
                    if (settingsTheme === undefined) {
                        store.dispatch(settingsEditIntent('theme', { theme: core.theme }, true));
                    }
                }
            } catch {}
        };

        void setThemeIfMultiAccounts();
    }, [authStore.getLocalID(), core.theme, app.state.status]);

    useVisibleEffect(
        (visible: boolean) => {
            if (visible && online && clientReady(app.state.status)) store.dispatch(startEventPolling());
            else if (!visible || !online) store.dispatch(stopEventPolling());
        },
        [online]
    );

    return <ReduxProvider store={store}>{children}</ReduxProvider>;
};
