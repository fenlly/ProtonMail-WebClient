import React from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import notFoundSvg from '@proton/styles/assets/img/illustrations/shared-page-not-found.svg';

import SharedPageLayout from '../Layout/SharedPageLayout';
import { DRIVE_LANDING_PAGE } from '../constant';

export default function SharedPageError() {
    return (
        <SharedPageLayout>
            <div className="flex flex-item-fluid flex-align-items-center py2 mb4">
                <div className="password-page--form-container ui-standard w100 relative shadow-lifted mw30r max-w100 center px2-25 py3 rounded">
                    <figure className="flex flex-justify-center pb2">
                        <img className="hauto" src={notFoundSvg} alt={c('Info').t`Shared link not found`} />
                    </figure>
                    <h3 className="text-center text-bold">{c('Title').t`Hm, we couldn't find that one`}</h3>
                    <p className="text-center mt0-5 mb4">
                        {c('Info')
                            .t`This file may have been deleted, moved or made unavailable. Try reaching out to the file owner.`}
                    </p>
                    <ButtonLike as="a" size="large" fullWidth color="norm" href={DRIVE_LANDING_PAGE}>
                        {c('Action').t`Back to Homepage`}
                    </ButtonLike>
                </div>
            </div>
        </SharedPageLayout>
    );
}
