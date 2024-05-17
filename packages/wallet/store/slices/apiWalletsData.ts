import { createAction, createSlice } from '@reduxjs/toolkit';

import { ModelState } from '@proton/account';
import { WasmApiWalletAccount } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import { IWasmApiWalletData, WalletEventLoop } from '../../types';
import { stateFromWalletAccountEvent, stateFromWalletEvent } from '../../utils';
import { WalletThunkArguments } from '../thunk';

export const apiWalletsDataSliceName = 'api_wallets_data' as const;

export interface ApiWalletsDataState {
    [apiWalletsDataSliceName]: ModelState<IWasmApiWalletData[]>;
}

type SliceState = ApiWalletsDataState[typeof apiWalletsDataSliceName];
type Model = NonNullable<SliceState['value']>;

export const selectApiWalletsData = (state: ApiWalletsDataState) => state[apiWalletsDataSliceName];

const modelThunk = createAsyncModelThunk<Model, ApiWalletsDataState, WalletThunkArguments>(
    `${apiWalletsDataSliceName}/fetch`,
    {
        miss: ({ extraArgument }) => {
            return extraArgument.walletApi
                .clients()
                .wallet.getWallets()
                .then(async (payload) => {
                    const wallets = payload[0];

                    return Promise.all(
                        wallets.map(async ({ Wallet, WalletKey, WalletSettings }) => {
                            const accounts: WasmApiWalletAccount[] = await extraArgument.walletApi
                                .clients()
                                .wallet.getWalletAccounts(Wallet.ID)
                                .then((accounts) => accounts[0].map((accountPayload) => accountPayload.Data))
                                .catch(() => []);

                            return {
                                Wallet: Wallet,
                                WalletKey: WalletKey,
                                WalletSettings: WalletSettings,
                                WalletAccounts: accounts,
                            };
                        })
                    );
                });
        },
        previous: previousSelector(selectApiWalletsData),
    }
);

const initialState: SliceState = {
    value: undefined,
    error: undefined,
};

const eventLoopEvent = createAction('server event', (payload: WalletEventLoop) => ({ payload }));

export const walletCreation = createAction('wallet creation', (payload: IWasmApiWalletData) => ({ payload }));
export const walletDeletion = createAction('wallet deletion', (payload: { walletID: string }) => ({ payload }));
export const walletNameUpdate = createAction('wallet name update', (payload: { walletID: string; name: string }) => ({
    payload,
}));
// TODO: handle wallet update

export const walletAccountCreation = createAction(
    'wallet account creation',
    (payload: { walletID: string; account: WasmApiWalletAccount }) => ({ payload })
);
export const walletAccountUpdate = createAction(
    'wallet account update',
    (payload: { walletID: string; account: WasmApiWalletAccount }) => ({ payload })
);
export const walletAccountDeletion = createAction(
    'wallet account deletion',
    (payload: { walletID: string; walletAccountID: string }) => ({ payload })
);

const slice = createSlice({
    name: apiWalletsDataSliceName,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);

        builder
            .addCase(eventLoopEvent, (state, event) => {
                event.payload.Wallets?.forEach((walletEvent) => {
                    if (state.value) {
                        state.value = stateFromWalletEvent(walletEvent, event.payload, state.value);
                    }
                });

                // FIXME: this doesn't work because API doesn't fill WalletID for now
                event.payload.WalletAccounts?.forEach((walletAccountAction) => {
                    if (state.value) {
                        state.value = stateFromWalletAccountEvent(walletAccountAction, state.value);
                    }
                });
            })
            .addCase(walletCreation, (state, action) => {
                if (state.value && !state.value.some(({ Wallet: { ID } }) => ID === action.payload.Wallet.ID)) {
                    state.value.push(action.payload);
                }
            })
            .addCase(walletDeletion, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);
                    state.value = state.value.splice(walletIndex, 0);
                }
            })
            .addCase(walletNameUpdate, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);
                    state.value[walletIndex].Wallet.Name = action.payload.name;
                }
            })
            .addCase(walletAccountCreation, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);

                    state.value[walletIndex].WalletAccounts.push(action.payload.account);
                }
            })
            .addCase(walletAccountUpdate, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);
                    const walletAtIndex = state.value[walletIndex];

                    const walletAccountIndex = walletAtIndex.WalletAccounts.findIndex(
                        (data) => data.ID === action.payload.account.ID
                    );

                    state.value[walletIndex].WalletAccounts[walletAccountIndex] = action.payload.account;
                }
            })
            .addCase(walletAccountDeletion, (state, action) => {
                if (state.value) {
                    const walletIndex = state.value.findIndex((data) => data.Wallet.ID === action.payload.walletID);
                    const walletAtIndex = state.value[walletIndex];

                    const walletAccountIndex = walletAtIndex.WalletAccounts.findIndex(
                        (data) => data.ID === action.payload.walletAccountID
                    );

                    state.value[walletIndex].WalletAccounts.splice(walletAccountIndex, 0);
                }
            });
    },
});

export const apiWalletsDataReducer = { [apiWalletsDataSliceName]: slice.reducer };
export const apiWalletsDataThunk = modelThunk.thunk;
