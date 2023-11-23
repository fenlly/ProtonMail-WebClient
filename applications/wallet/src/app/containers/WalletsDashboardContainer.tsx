import React from 'react';

import { BalanceOverview, YourWalletsSection } from '../components';
import { Transaction, Wallet, WalletKind } from '../types';

// TODO: replace by wallets from API when done
const wallets: Wallet[] = [
    { kind: WalletKind.LIGHTNING, name: 'lightning 01', id: '0', balance: 100067 },
    { kind: WalletKind.ONCHAIN, name: 'Bitcoin 01', id: '1', balance: 11783999 },
    { kind: WalletKind.ONCHAIN, name: 'Bitcoin 02', id: '2', balance: 97536 },
    { kind: WalletKind.ONCHAIN, name: 'Bitcoin 03', id: '3', balance: 8287263 },
    { kind: WalletKind.LIGHTNING, name: 'Lightning 02', id: '4', balance: 2612374 },
];

// TODO: replace by transactions fetched with PWC when wallet API is done
const transactions: Transaction[] = [
    { value: 950918, timestamp: 1700159117000 },
    { value: -619482, timestamp: 1700649459000 },
    { value: 354970, timestamp: 1700402779000 },
    { value: 630656, timestamp: 1700034653000 },
    { value: -763580, timestamp: 1700286123000 },
    { value: 679892, timestamp: 1700402923000 },
    { value: 98291, timestamp: 1700224823000 },
    { value: 724192, timestamp: 1700339971000 },
    { value: -885519, timestamp: 1700088803000 },
    { value: 403709, timestamp: 1700428172000 },
    { value: -102097, timestamp: 1700591072000 },
    { value: 871157, timestamp: 1700316013000 },
    { value: 601852, timestamp: 1700306255000 },
    { value: -529832, timestamp: 1700593494000 },
    { value: 719777, timestamp: 1700218090000 },
    { value: -478480, timestamp: 1700418812000 },
    { value: -5029, timestamp: 1700399220000 },
    { value: -906759, timestamp: 1700629366000 },
    { value: 557077, timestamp: 1700074540000 },
    { value: -161112, timestamp: 1700222245000 },
    { value: -10061112, timestamp: 1700222245000 },
];

export const WalletsDashboardContainer = () => {
    return (
        <div className="w-full">
            {/* Main content */}
            <div>
                <BalanceOverview wallets={wallets} transactions={transactions} />

                <YourWalletsSection wallets={wallets} />

                {/*TODO: Explore */}
                <div></div>
            </div>

            {/*TODO: Side content */}
            <div>
                {/*TODO: Quick actions */}
                <div></div>

                {/*TODO: Transactions history */}
                <div></div>
            </div>
        </div>
    );
};
