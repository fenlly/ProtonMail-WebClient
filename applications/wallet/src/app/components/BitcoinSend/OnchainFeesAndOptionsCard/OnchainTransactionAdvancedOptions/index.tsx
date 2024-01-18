import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { WasmTxBuilder } from '../../../../../pkg';
import { AccountWithBlockchainData } from '../../../../types';
import { AdvancedOptionsModal } from './AdvancedOptionsModal';
import { ManualCoinSelectionModal } from './ManualCoinSelectionModal';
import { useOnchainTransactionAdvancedOptions } from './useOnchainTransactionAdvancedOptions';

interface Props {
    account?: AccountWithBlockchainData;
    txBuilder: WasmTxBuilder;
    updateTxBuilder: (updater: (txBuilder: WasmTxBuilder) => WasmTxBuilder) => void;
}

export const OnchainTransactionAdvancedOptions = ({ account, txBuilder, updateTxBuilder }: Props) => {
    const {
        manualCoinSelectionModal,
        handleManualCoinSelection,
        openAdvancedOptionsModal,
        ...otherAdvancedOptionHelpers
    } = useOnchainTransactionAdvancedOptions(updateTxBuilder);

    return (
        <>
            <div className="flex flex-row justify-space-between">
                <h3 className="text-rg text-semibold flex-1">{c('Wallet Send').t`Advanced options`}</h3>

                <Button className="mr-2 text-sm" size="small" shape="underline" onClick={openAdvancedOptionsModal}>
                    {c('Wallet Send').t`Customise`}
                </Button>
            </div>

            <AdvancedOptionsModal txBuilder={txBuilder} helpers={otherAdvancedOptionHelpers} />

            <ManualCoinSelectionModal
                modalState={manualCoinSelectionModal}
                account={account}
                selectedUtxos={txBuilder.getUtxosToSpend()}
                onCoinSelected={handleManualCoinSelection}
            />
        </>
    );
};
