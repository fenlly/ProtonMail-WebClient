import { c } from 'ttag';

import { MailLogo } from '@proton/components';
import { getCalendarAppFeature } from '@proton/components/containers/payments/features/calendar';
import { getFreeMailStorageFeature, getStorageFeature } from '@proton/components/containers/payments/features/drive';
import { getSupport } from '@proton/components/containers/payments/features/highlights';
import {
    getFoldersAndLabelsFeature,
    getNAddressesFeature,
    getNDomainsFeature,
    getNMessagesFeature,
} from '@proton/components/containers/payments/features/mail';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { PLANS } from '@proton/payments';
import { APPS, BRAND_NAME, CYCLE, MAIL_APP_NAME, MAIL_SHORT_APP_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import type { FreePlanDefault, Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { SignupType } from '../../signup/interfaces';
import type { BenefitItem } from '../Benefits';
import Benefits from '../Benefits';
import FeatureListPlanCardSubSection from '../FeatureListPlanCardSubSection';
import LetsTalkGenericSubSection from '../LetsTalkGenericSubsection';
import { planCardFeatureProps } from '../PlanCardSelector';
import {
    getAdvancedSecurityBenefit,
    getAppsIncludedBenefit,
    getAppsMailIncludedBenefit,
    getBasedInSwitzerlandGDPRBenefit,
    getBenefits,
    getBuiltInEncryptionBenefit,
    getBundleVisionaryBenefits,
    getEmailAliasesBenefit,
    getFamilyDuoBenefits,
    getGenericFeatures,
    getISO27001CertifiedBenefit,
    getJoinString,
    getOpenSourceAndAuditedBenefit,
    getSwissPrivacyLawsBenefit,
    getTeamKnowsEncryptionBenefit,
    getWorksOnAllDevicesBenefit,
} from '../configuration/helper';
import type { PlanParameters, SignupConfiguration } from '../interface';
import { SignupMode } from '../interface';
import CustomStep from './CustomStep';
import setupAccount from './account-setup.svg';

const getMailBenefitsTitle = (plan: PLANS | undefined, audience: Audience | undefined) => {
    if (plan === PLANS.BUNDLE_PRO_2024 || plan === PLANS.BUNDLE || plan === PLANS.FAMILY) {
        return getBenefits(BRAND_NAME);
    }
    if (audience === Audience.B2B) {
        return getBenefits(MAIL_APP_NAME);
    }
    return c('Signup: Info').t`The only email service with:`;
};

export const getMailBenefits = (plan: PLANS | undefined, audience: Audience | undefined): BenefitItem[] => {
    if (plan === PLANS.BUNDLE || plan === PLANS.VISIONARY) {
        return getBundleVisionaryBenefits();
    }

    if (plan === PLANS.FAMILY || plan === PLANS.DUO) {
        return getFamilyDuoBenefits();
    }

    if (plan === PLANS.BUNDLE_PRO_2024) {
        return [
            getOpenSourceAndAuditedBenefit(),
            getBasedInSwitzerlandGDPRBenefit(),
            getISO27001CertifiedBenefit(),
            getTeamKnowsEncryptionBenefit(),
            getWorksOnAllDevicesBenefit(),
            getAppsIncludedBenefit(),
        ];
    }

    if (audience === Audience.B2B) {
        return [
            getOpenSourceAndAuditedBenefit(),
            getBasedInSwitzerlandGDPRBenefit(),
            getISO27001CertifiedBenefit(),
            getTeamKnowsEncryptionBenefit(),
            getWorksOnAllDevicesBenefit(),
            getAppsMailIncludedBenefit(),
        ];
    }

    return [
        getBuiltInEncryptionBenefit(),
        getSwissPrivacyLawsBenefit(),
        getEmailAliasesBenefit(),
        getAdvancedSecurityBenefit(),
        getAppsMailIncludedBenefit(),
    ];
};

export const getFreeMailFeatures = (freePlan: FreePlanDefault) => {
    return [
        getFreeMailStorageFeature(freePlan),
        getNAddressesFeature({ n: 1 }),
        getFoldersAndLabelsFeature(3),
        getNMessagesFeature(150),
    ];
};

export const getCustomMailFeatures = (plan: Plan | undefined, freePlan: FreePlanDefault) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeature(plan.MaxSpace, {
            freePlan,
            family: plan.Name === PLANS.FAMILY,
            duo: plan.Name === PLANS.DUO,
        }),
        getNAddressesFeature({ n: plan.MaxAddresses }),
        getFoldersAndLabelsFeature('unlimited'),
        getNMessagesFeature('unlimited'),
        getNDomainsFeature({ n: plan.MaxDomains }),
        getSupport('priority'),
        getCalendarAppFeature(),
    ];
};

export const getPlanTitle = (plan: Plan | undefined) => {
    if (!plan) {
        return;
    }
    if (plan.Name === PLANS.VISIONARY) {
        return c('mail_signup_2023: Info').t`Become a Visionary and be part of ${BRAND_NAME}'s story`;
    }
};

export const getMailConfiguration = ({
    freePlan,
    mode,
    plan,
    audience,
    isLargeViewport,
    hideFreePlan,
    plansMap,
}: {
    freePlan: FreePlanDefault;
    audience: Audience.B2B | Audience.B2C;
    mode: SignupMode;
    plan: Plan | undefined;
    hideFreePlan: boolean;
    isLargeViewport: boolean;
    vpnServersCountData: VPNServersCountData;
    planParameters: PlanParameters | undefined;
    plansMap?: PlansMap;
}): SignupConfiguration => {
    const logo = <MailLogo />;

    const title = c('mail_signup_2024: Info').t`An encrypted email service that puts your privacy first`;
    const b2bTitle = c('mail_signup_2024: Info').t`Encrypted solutions to protect your entire business`;
    const inviteTitle = c('mail_signup_2024: Info').t`You’ve been invited to try ${MAIL_APP_NAME}`;

    const features = getGenericFeatures(isLargeViewport, audience);

    let planCards: SignupConfiguration['planCards'] = {
        [Audience.B2B]: [
            {
                plan: PLANS.MAIL_PRO,
                subsection: (
                    <FeatureListPlanCardSubSection
                        description={c('mail_signup_2024: Info').t`Encrypted email and calendar to get you started`}
                        features={
                            <PlanCardFeatureList
                                {...planCardFeatureProps}
                                features={getCustomMailFeatures(plansMap?.[PLANS.MAIL_PRO], freePlan)}
                            />
                        }
                    />
                ),
                type: 'standard' as const,
                guarantee: true,
            },
            {
                plan: PLANS.MAIL_BUSINESS,
                subsection: (
                    <FeatureListPlanCardSubSection
                        description={c('mail_signup_2024: Info').t`Enhanced security and premium features for teams`}
                        features={
                            <PlanCardFeatureList
                                {...planCardFeatureProps}
                                features={getCustomMailFeatures(plansMap?.[PLANS.MAIL_BUSINESS], freePlan)}
                            />
                        }
                    />
                ),
                type: 'standard' as const,
                guarantee: true,
            },
            {
                plan: PLANS.BUNDLE_PRO_2024,
                subsection: (
                    <FeatureListPlanCardSubSection
                        description={c('mail_signup_2024: Info')
                            .t`All ${BRAND_NAME} for Business apps and premium features to protect your entire business`}
                        features={
                            <PlanCardFeatureList
                                {...planCardFeatureProps}
                                features={getCustomMailFeatures(plansMap?.[PLANS.BUNDLE_PRO_2024], freePlan)}
                            />
                        }
                    />
                ),
                type: 'best' as const,
                guarantee: true,
            },
            {
                plan: PLANS.ENTERPRISE,
                subsection: <LetsTalkGenericSubSection app="mail" />,
                type: 'standard' as const,
                guarantee: true,
                interactive: false,
            },
        ],
        [Audience.B2C]: [
            !hideFreePlan && {
                plan: PLANS.FREE,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getFreeMailFeatures(freePlan)} />,
                type: 'standard' as const,
                guarantee: false,
            },
            {
                plan: PLANS.MAIL,
                subsection: (
                    <PlanCardFeatureList
                        {...planCardFeatureProps}
                        features={getCustomMailFeatures(plansMap?.[PLANS.MAIL], freePlan)}
                    />
                ),
                type: 'standard' as const,
                guarantee: true,
            },
            {
                plan: PLANS.BUNDLE,
                subsection: (
                    <PlanCardFeatureList
                        {...planCardFeatureProps}
                        features={getCustomMailFeatures(plansMap?.[PLANS.BUNDLE], freePlan)}
                    />
                ),
                type: 'best' as const,
                guarantee: true,
            },
            {
                plan: PLANS.FAMILY,
                subsection: (
                    <PlanCardFeatureList
                        {...planCardFeatureProps}
                        features={getCustomMailFeatures(plansMap?.[PLANS.FAMILY], freePlan)}
                    />
                ),
                type: 'standard' as const,
                guarantee: true,
            },
        ].filter(isTruthy),
    };

    if (mode === SignupMode.MailReferral) {
        planCards = {
            [Audience.B2C]: [
                {
                    plan: PLANS.FREE,
                    subsection: (
                        <PlanCardFeatureList {...planCardFeatureProps} features={getFreeMailFeatures(freePlan)} />
                    ),
                    type: 'standard' as const,
                    guarantee: false,
                },
                {
                    plan: PLANS.MAIL,
                    subsection: (
                        <PlanCardFeatureList
                            {...planCardFeatureProps}
                            features={getCustomMailFeatures(plansMap?.[PLANS.MAIL], freePlan)}
                        />
                    ),
                    type: 'best' as const,
                    guarantee: true,
                },
            ],
            [Audience.B2B]: [],
        };
    }

    const benefitItems = getMailBenefits(plan?.Name as PLANS, audience);
    const benefits = benefitItems && (
        <div>
            <div className="text-lg text-semibold">{getMailBenefitsTitle(plan?.Name as PLANS, audience)}</div>
            <Benefits className="mt-5 mb-5" features={benefitItems} />
            <div>{getJoinString()}</div>
        </div>
    );

    return {
        logo,
        audience,
        audiences: [
            {
                value: Audience.B2C,
                locationDescriptor: {
                    pathname: SSO_PATHS.MAIL_SIGNUP,
                    search: 'mode=sps',
                },
                title: c('mail_signup_2024: title').t`For individuals`,
                defaultPlan: PLANS.BUNDLE,
            },
            {
                value: Audience.B2B,
                locationDescriptor: {
                    pathname: SSO_PATHS.MAIL_SIGNUP_B2B,
                    search: 'mode=sps',
                },
                title: c('mail_signup_2024: title').t`For businesses`,
                defaultPlan: PLANS.BUNDLE_PRO_2024,
            },
        ],
        title: {
            [SignupMode.Default]: audience === Audience.B2B ? b2bTitle : title,
            [SignupMode.Invite]: inviteTitle,
            [SignupMode.MailReferral]: title,
            [SignupMode.PassSimpleLogin]: title,
        }[mode],
        features,
        benefits,
        planCards,
        signupTypes: [SignupType.Username],
        onboarding: {
            user: false,
            signup: true,
        },
        generateMnemonic: false,
        defaults: {
            plan: (() => {
                if (audience === Audience.B2B) {
                    return PLANS.BUNDLE_PRO_2024;
                }
                return PLANS.BUNDLE;
            })(),
            cycle: CYCLE.YEARLY,
        },
        product: APPS.PROTONMAIL,
        shortProductAppName: MAIL_SHORT_APP_NAME,
        productAppName: MAIL_APP_NAME,
        setupImg: <img src={setupAccount} alt="" />,
        preload: (
            <>
                <link rel="prefetch" href={setupAccount} as="image" />
            </>
        ),
        CustomStep,
        cycles: [CYCLE.MONTHLY, CYCLE.YEARLY],
    };
};
