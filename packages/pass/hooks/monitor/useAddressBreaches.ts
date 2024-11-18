import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import type { FetchedBreaches } from '@proton/components';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { type AddressBreachDTO, AddressType } from '@proton/pass/lib/monitor/types';
import { getAliasBreach, getCustomBreach, getProtonBreach } from '@proton/pass/store/actions';
import { selectLoginsByUserIdentifier } from '@proton/pass/store/selectors';
import type { LoginItem } from '@proton/pass/types';
import { partition } from '@proton/pass/utils/array/partition';

const getRequest = (dto: AddressBreachDTO) => {
    switch (dto.type) {
        case AddressType.PROTON:
            return [getProtonBreach, dto.addressId] as const;
        case AddressType.ALIAS:
            return [getAliasBreach, dto] as const;
        case AddressType.CUSTOM:
            return [getCustomBreach, dto.addressId] as const;
    }
};

export type BreachDetails = {
    loading: boolean;
    resolved: FetchedBreaches[];
    active: FetchedBreaches[];
    usages: LoginItem[];
};

export const useAddressBreaches = <T extends AddressType>(dto: AddressBreachDTO<T>, email: string) => {
    const [request, initial] = getRequest(dto);
    const req = useRequest(request, { initial });
    const usages = useSelector(selectLoginsByUserIdentifier(email));

    useEffect(() => {
        switch (dto.type) {
            case AddressType.PROTON:
                return req.dispatch(dto.addressId);
            case AddressType.ALIAS:
                return req.dispatch({ shareId: dto.shareId, itemId: dto.itemId });
            case AddressType.CUSTOM:
                return req.dispatch(dto.addressId);
        }
    }, []);

    return useMemo<BreachDetails>(() => {
        const data = req.loading ? [] : (req.data ?? []);
        const [active, resolved] = partition(data, ({ resolvedState }) => resolvedState < 3);
        return { loading: req.loading, active, resolved, usages };
    }, [req, usages]);
};
