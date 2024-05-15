import { useCallback, useState } from 'react';

import { compact } from 'lodash';

import { WasmApiBitcoinAddressesCreationPayload } from '@proton/andromeda';
import { useAddressesKeys } from '@proton/components/hooks';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto/lib';
import { IWasmApiWalletData, useWalletApiClients } from '@proton/wallet';

import { POOL_FILLING_THRESHOLD } from '../../constants/email-integration';
import { useGetBitcoinAddressHighestIndex } from '../../store/hooks/useBitcoinAddressHighestIndex';
import { WalletWithChainData } from '../../types';

export const useBitcoinAddressPool = ({
    decryptedApiWalletsData,
    walletsChainData,
}: {
    decryptedApiWalletsData?: IWasmApiWalletData[];
    walletsChainData: Partial<Record<string, WalletWithChainData>>;
}) => {
    const api = useWalletApiClients();

    const getBitcoinAddressHighestIndex = useGetBitcoinAddressHighestIndex();
    const [addresses] = useAddressesKeys();
    const [isLoading, setIsLoading] = useState(false);

    const fillPool = useCallback(async () => {
        setIsLoading(true);
        for (const decryptedWallet of decryptedApiWalletsData ?? []) {
            const walletId = decryptedWallet.Wallet.ID;

            const wallet = walletsChainData[walletId];

            // We cannot create address with the wasm wallet
            if (!wallet) {
                continue;
            }

            for (const walletAccount of decryptedWallet.WalletAccounts) {
                const walletAccountId = walletAccount.ID;
                const wasmAccount = wallet.accounts[walletAccountId];

                if (!wasmAccount || !walletAccount.Addresses.length) {
                    continue;
                }

                const addressKeys = compact(
                    walletAccount.Addresses.flatMap(
                        (addressA) => addresses?.find((addressB) => addressA.ID === addressB.address.ID)?.keys
                    )
                );

                const highestApiIndex = await getBitcoinAddressHighestIndex(walletId, walletAccountId);

                // TODO: interact with useWalletsChainData to do sync
                const highestNetworkIndexValue = await wasmAccount.account.getLastUnusedAddressIndex();

                let highestIndex = Math.max(highestApiIndex, highestNetworkIndexValue);

                const unusedBitcoinAddress = await api.bitcoin_address
                    .getBitcoinAddresses(walletId, walletAccountId)
                    .then((data) => data[0]);

                const computeAddressDataFromIndex = async (index: number) => {
                    const { address } = await wasmAccount.account.getAddress(index);

                    const signature = await CryptoProxy.signMessage({
                        signingKeys: addressKeys.map((k) => k.privateKey),
                        textData: address,
                        detached: true,
                    });

                    return {
                        BitcoinAddressIndex: index,
                        BitcoinAddress: address,
                        BitcoinAddressSignature: signature,
                    };
                };

                // Create missing addresses
                const addressesToCreate = Math.max(0, POOL_FILLING_THRESHOLD - unusedBitcoinAddress.length);

                if (addressesToCreate > 0) {
                    const payload = new WasmApiBitcoinAddressesCreationPayload();

                    for (let i = 1; i <= addressesToCreate; i++) {
                        highestIndex = highestIndex + 1;

                        try {
                            const addressData = await computeAddressDataFromIndex(highestIndex);
                            payload.push(addressData);
                        } catch (e) {
                            console.error('Could not create bitcoin address creation payload', e);
                        }
                    }

                    try {
                        await api.bitcoin_address.addBitcoinAddress(walletId, walletAccountId, payload);
                    } catch (e) {
                        console.error('Could not add new bitcoin addresses', e);
                    }
                }

                // TMP FIX: empty pool on address change

                // Update addresses without bitcoin address or with outdated ones
                const addressesWithOutdatedSignature = await Promise.all(
                    unusedBitcoinAddress.map(async (addr) => {
                        if (!addr.Data.BitcoinAddressSignature || !addr.Data.BitcoinAddress) {
                            return addr;
                        }

                        const { verified } = await CryptoProxy.verifyMessage({
                            armoredSignature: addr.Data.BitcoinAddressSignature,
                            textData: addr.Data.BitcoinAddress,
                            verificationKeys: addressKeys.map((k) => k.publicKey),
                        });

                        return verified === VERIFICATION_STATUS.SIGNED_AND_VALID ? undefined : addr;
                    })
                );

                for (const addressToUpdate of compact(addressesWithOutdatedSignature)) {
                    try {
                        const localHighestIndex = addressToUpdate?.Data.BitcoinAddressIndex ?? highestIndex + 1;

                        const addressData = await computeAddressDataFromIndex(localHighestIndex);
                        highestIndex = localHighestIndex;

                        await api.bitcoin_address.updateBitcoinAddress(
                            walletId,
                            walletAccountId,
                            addressToUpdate.Data.ID,
                            addressData
                        );
                    } catch (e) {
                        console.error('Could not update bitcoin address', e);
                    }
                }
            }
        }
        setIsLoading(false);
    }, [addresses, api, decryptedApiWalletsData, getBitcoinAddressHighestIndex, walletsChainData]);

    return { isLoading, fillPool };
};
