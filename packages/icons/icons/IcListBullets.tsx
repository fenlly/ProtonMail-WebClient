/*
 * This file is auto-generated. Do not modify it manually!
 * Run 'yarn workspace @proton/icons build' to update the icons react components.
 */
import React from 'react';

import type { IconSize } from '../types';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    /** If specified, renders an sr-only element for screenreaders */
    alt?: string;
    /** If specified, renders an inline title element */
    title?: string;
    /**
     * The size of the icon
     * Refer to the sizing taxonomy: https://design-system.protontech.ch/?path=/docs/components-icon--basic#sizing
     */
    size?: IconSize;
}

export const IcListBullets = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
    return (
        <>
            <svg
                viewBox={viewBox}
                className={`icon-size-${size} ${className}`}
                role="img"
                focusable="false"
                aria-hidden="true"
                {...rest}
            >
                {title ? <title>{title}</title> : null}

                <path
                    fillRule="evenodd"
                    d="M6 4a.5.5 0 0 0 0 1h7.5a.5.5 0 0 0 0-1H6Zm0 5h7.5a.5.5 0 0 0 0-1H6a.5.5 0 0 0 0 1Zm-.5 3.5A.5.5 0 0 1 6 12h7.5a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5Z"
                ></path>
                <path
                    fillRule="evenodd"
                    d="M2.5 4a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1Zm0 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1ZM2 12.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5Z"
                ></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};
