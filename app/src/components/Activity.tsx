import { Box } from '@mui/material';
import { FlowWalletType, WalletType } from '../types/FlowType';
import NetworkSelectorSection from './NetworkSelectorSection';
import { useState } from 'react';
import { Chain } from 'viem';

export type AssetsProps = {
  wallets: FlowWalletType[];
};

export default function Activity(props: AssetsProps) {
  const { wallets } = props;

  const [selectedNetwork, setSelectedNetwork] = useState<Chain>();

  return (
    <Box m={1}>
      <NetworkSelectorSection
        wallets={wallets as WalletType[]}
        selectedNetwork={selectedNetwork}
        setSelectedNetwork={setSelectedNetwork}
      />
      <Box display="flex" flexDirection="column">
        txs
      </Box>
    </Box>
  );
}
