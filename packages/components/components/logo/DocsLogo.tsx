import type { ComponentPropsWithoutRef } from 'react';
import { useState } from 'react';

import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import type { LogoProps } from './Logo';

type Props = ComponentPropsWithoutRef<'svg'> & Pick<LogoProps, 'variant' | 'size' | 'hasTitle'>;

const DriveLogo = ({ variant = 'with-wordmark', size, className, hasTitle = true, ...rest }: Props) => {
    // This logo can be several times in the view, ids has to be different each time
    const [uid] = useState(generateUID('logo'));

    let logoWidth: number;

    switch (variant) {
        case 'glyph-only':
            logoWidth = 36;
            break;
        case 'wordmark-only':
            logoWidth = 246;
            break;
        default:
            logoWidth = 140;
            break;
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox={`0 0 ${logoWidth} 36`}
            width={logoWidth}
            className={clsx('logo', size && variant === 'glyph-only' && `icon-size-${size}`, variant, className)}
            aria-labelledby={`${uid}-title`}
            {...rest}
        >
            {hasTitle && <title id={`${uid}-title`}>{DRIVE_APP_NAME}</title>}
            <g clipPath="url(#a)">
                <path
                    fill="#1B1340"
                    d="M38 21.259v3.665h2.56v-3.505a1.282 1.282 0 0 1 1.279-1.287h2.624a4.593 4.593 0 0 0 3.261-1.36 4.652 4.652 0 0 0 1.351-3.28c0-1.229-.486-2.41-1.35-3.282a4.603 4.603 0 0 0-3.265-1.358H38v4.58h2.56v-2.158h3.73c.58 0 1.134.232 1.544.643a2.2 2.2 0 0 1 0 3.105c-.41.412-.964.643-1.544.643h-2.71a3.553 3.553 0 0 0-2.528 1.055 3.652 3.652 0 0 0-.776 1.166A3.54 3.54 0 0 0 38 21.26Zm11.47 3.665V19.34c0-2.278 1.322-4.09 3.97-4.09a5.09 5.09 0 0 1 1.262.14v2.295c-.301-.02-.56-.02-.682-.02-1.402 0-2.005.646-2.005 1.956v5.303H49.47Zm5.994-4.734c0-2.802 2.104-4.938 5.033-4.938 2.929 0 5.033 2.136 5.033 4.937 0 2.802-2.104 4.958-5.033 4.958-2.929 0-5.033-2.159-5.033-4.957Zm7.558 0c0-1.593-1.064-2.722-2.525-2.722-1.465 0-2.525 1.126-2.525 2.721 0 1.613 1.063 2.722 2.525 2.722 1.464 0 2.525-1.112 2.525-2.722Zm10.646 0c0-2.802 2.104-4.938 5.032-4.938 2.926 0 5.03 2.136 5.03 4.937 0 2.802-2.104 4.958-5.03 4.958-2.928 0-5.032-2.159-5.032-4.957Zm7.554 0c0-1.593-1.063-2.722-2.524-2.722-1.462 0-2.525 1.126-2.525 2.721 0 1.613 1.063 2.722 2.525 2.722 1.461 0 2.525-1.112 2.525-2.722Zm3.831 4.734v-5.38c0-2.5 1.583-4.295 4.41-4.295 2.806 0 4.39 1.793 4.39 4.294v5.38h-2.525v-5.18c0-1.389-.623-2.258-1.865-2.258-1.243 0-1.865.866-1.865 2.259v5.18h-2.545Zm-12.147-7.436h-2.747v3.527c0 1.23.44 1.793 1.703 1.793.12 0 .42 0 .802-.02v2.075c-.52.14-.981.224-1.484.224-2.124 0-3.569-1.29-3.569-3.728v-3.871h-1.706v-2.036h.427a1.3 1.3 0 0 0 .489-.097 1.285 1.285 0 0 0 .694-.697c.065-.158.096-.323.096-.492v-1.918h2.545v3.204h2.747v2.036h.003Zm64.469 7.628c-2.22 0-3.809-1.284-3.951-3.096h2.464c.122.733.774 1.08 1.487 1.08.733 0 1.182-.347 1.182-.816 0-1.548-4.889-.59-4.889-4.297 0-1.59 1.324-2.872 3.483-2.872 2.098-.02 3.524 1.1 3.667 2.973h-2.424c-.102-.57-.55-.957-1.243-.957-.672 0-1.1.367-1.1.856 0 1.487 4.95.631 4.95 4.298 0 1.71-1.67 2.83-3.626 2.83Zm-9.628 0c-2.913 0-5.052-2.14-5.052-5.011 0-2.872 2.139-4.99 5.052-4.99 2.485 0 4.318 1.486 4.705 3.686h-2.505c-.367-.916-1.1-1.426-2.139-1.426-1.487 0-2.567 1.12-2.567 2.73 0 1.609 1.08 2.75 2.567 2.75 1.039 0 1.752-.51 2.139-1.447h2.505c-.387 2.2-2.22 3.707-4.705 3.707Zm-10.923 0c-2.974 0-5.113-2.18-5.113-5.011 0-2.832 2.139-4.99 5.113-4.99 2.973 0 5.112 2.158 5.112 4.99 0 2.831-2.139 5.01-5.112 5.01Zm0-2.261c1.487 0 2.566-1.12 2.566-2.75 0-1.61-1.079-2.75-2.566-2.75-1.487 0-2.567 1.14-2.567 2.75 0 1.63 1.08 2.75 2.567 2.75ZM103.583 11c4.237 0 7.17 3.055 7.17 6.946 0 3.89-2.933 6.946-7.17 6.946H99V11h4.583Zm-1.976 11.407 2.119.02c2.566 0 4.359-1.996 4.359-4.481s-1.793-4.461-4.359-4.461h-2.119v8.922Z"
                />
                <rect width={28} height={28} y={3} fill="url(#b)" rx={4.167} />
                <path fill="#85D4F5" d="M14 3h7v7h-7z" />
                <path fill="#D6F1FC" d="M20.998 3h2.833a4.167 4.167 0 0 1 4.167 4.167V10h-7V3Z" />
                <path fill="#85D4F5" d="M20.998 10h7v7h-7z" />
                <path
                    fill="#fff"
                    fillRule="evenodd"
                    d="M15.168 25.167c0 .644-.522 1.166-1.166 1.166H5.835a1.167 1.167 0 1 1 0-2.333H14c.645 0 1.167.522 1.167 1.167Zm-3.5-4.668c0 .644-.522 1.166-1.166 1.166H5.835a1.167 1.167 0 0 1 0-2.333h4.667c.644 0 1.166.522 1.166 1.167Z"
                    clipRule="evenodd"
                />
            </g>
            <defs>
                <radialGradient
                    id="b"
                    cx={0}
                    cy={0}
                    r={1}
                    gradientTransform="rotate(-53.15 35.608 20.231) scale(33.0407)"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#6D4AFF" />
                    <stop offset={1} stopColor="#34B8EE" />
                </radialGradient>
                <clipPath id="a">
                    <path fill="#fff" d="M0 0h141v36H0z" />
                </clipPath>
            </defs>
        </svg>
    );
};

export default DriveLogo;
