import { fireEvent, render, screen } from '@testing-library/react';
import { Mock, vi } from 'vitest';

import { OnChainFeesSelector } from '.';
import { WasmTxBuilder } from '../../../pkg';
import * as useOnChainFeesSelectorModule from './useOnChainFeesSelector';

const baseMock: ReturnType<typeof useOnChainFeesSelectorModule.useOnChainFeesSelector> = {
    feeEstimations: [],
    blockTarget: 1,
    loadingFeeEstimation: false,
    isModalOpen: false,
    isRecommended: true,
    feeRateNote: 'HIGH',
    handleFeesSelected: vi.fn(),
    closeModal: vi.fn(),
    openModal: vi.fn(),
};

describe('OnChainFeesSelector', () => {
    let txBuilder: WasmTxBuilder;
    let mockUpdateTxBuilder: Mock;

    beforeEach(() => {
        txBuilder = new WasmTxBuilder();
        mockUpdateTxBuilder = vi.fn();
    });

    vi.spyOn(useOnChainFeesSelectorModule, 'useOnChainFeesSelector').mockReturnValue(baseMock);

    it('should display badge type and text corresponding to fee rate note', () => {
        vi.spyOn(useOnChainFeesSelectorModule, 'useOnChainFeesSelector').mockReturnValue(baseMock);

        const { rerender } = render(
            <OnChainFeesSelector txBuilder={txBuilder} updateTxBuilder={mockUpdateTxBuilder} />
        );

        screen.getByText(/High/i);

        vi.spyOn(useOnChainFeesSelectorModule, 'useOnChainFeesSelector').mockReturnValue({
            ...baseMock,
            feeRateNote: 'LOW',
        });

        rerender(<OnChainFeesSelector txBuilder={txBuilder} updateTxBuilder={mockUpdateTxBuilder} />);

        screen.getByText(/Low/i);
    });

    it('should not display `recommended` badge', () => {
        vi.spyOn(useOnChainFeesSelectorModule, 'useOnChainFeesSelector').mockReturnValue({
            ...baseMock,
            isRecommended: false,
        });
        render(<OnChainFeesSelector txBuilder={txBuilder} updateTxBuilder={mockUpdateTxBuilder} />);

        expect(screen.queryByText(/recommended/i)).not.toBeInTheDocument();
    });

    it('should display `recommended` badge', () => {
        vi.spyOn(useOnChainFeesSelectorModule, 'useOnChainFeesSelector').mockReturnValue(baseMock);
        render(<OnChainFeesSelector txBuilder={txBuilder} updateTxBuilder={mockUpdateTxBuilder} />);
        expect(screen.getByText(/recommended/i)).toBeInTheDocument();
    });

    it('should display fee rate and approx confirmation time', () => {
        vi.spyOn(useOnChainFeesSelectorModule, 'useOnChainFeesSelector').mockReturnValue({
            ...baseMock,
            blockTarget: 9,
        });

        const updated = txBuilder.set_fee_rate(3.4);
        render(<OnChainFeesSelector txBuilder={updated} updateTxBuilder={mockUpdateTxBuilder} />);

        expect(screen.getByText('3.40sats/vb')).toBeInTheDocument();
        expect(screen.getByText('Confirmation in ~90 minutes expected')).toBeInTheDocument();
    });

    describe('when user clicks on `Modify`', () => {
        it('should open modal', () => {
            render(<OnChainFeesSelector txBuilder={txBuilder} updateTxBuilder={mockUpdateTxBuilder} />);

            const btn = screen.getByText('Modify');
            expect(btn).toBeInTheDocument();
            fireEvent.click(btn);

            expect(baseMock.openModal).toHaveBeenCalledTimes(1);
            expect(baseMock.openModal).toHaveBeenCalledWith();
        });
    });
});
