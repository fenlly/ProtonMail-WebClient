import React, { ComponentPropsWithRef, ReactNode } from 'react';

interface Props extends ComponentPropsWithRef<'div'> {
    imageProps?: ComponentPropsWithRef<'img'>;
    children: ReactNode;
}

const EmptyViewContainer = ({ imageProps, children, ...containerProps }: Props) => {
    return (
        <div className="mauto p3" {...containerProps}>
            <figure className="flex-item-fluid text-center p1">
                {imageProps && <img className="hauto" {...imageProps} alt={imageProps.alt || ''} />}
                <figcaption className="mt2">{children}</figcaption>
            </figure>
        </div>
    );
};

export default EmptyViewContainer;
