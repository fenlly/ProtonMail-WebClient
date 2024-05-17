import * as useAddressesModule from '@proton/account/addresses/hooks';
import { Address } from '@proton/shared/lib/interfaces';

export const mockUseAddresses = (value: [Address[]?, boolean?] = []) => {
    const [addresses, cached = false] = value;
    const mockedUseAddresses = vi.spyOn(useAddressesModule, 'useAddresses');
    mockedUseAddresses.mockReturnValue([addresses ?? [], Boolean(cached)]);
    return mockedUseAddresses;
};
