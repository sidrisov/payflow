import { Box, Stack, Typography } from '@mui/material';
import { FlowWalletType, SafeWalletType } from '../types/FlowType';
import NetworkSelectorSection from './NetworkSelectorSection';
import { useState } from 'react';
import { Chain } from 'viem';
import { ActivityFetchResultType } from '../types/ActivityFetchResultType';
import { useNetwork } from 'wagmi';
import ActivitySection from './ActivitySection';
import { ActivitySkeletonSection } from './ActivitySkeletonSection';

export type AssetsProps = {
  wallets: FlowWalletType[];
  activityFetchResult: ActivityFetchResultType;
};

export default function Activity(props: AssetsProps) {
  const { wallets } = props;

  const [selectedNetwork, setSelectedNetwork] = useState<Chain>();

  const { loading, fetched, transactions } = props.activityFetchResult;

  const { chains } = useNetwork();

  return (
    <Box m={1}>
      <NetworkSelectorSection
        wallets={wallets as SafeWalletType[]}
        selectedNetwork={selectedNetwork}
        setSelectedNetwork={setSelectedNetwork}
      />
      <Stack p={1} spacing={1} minWidth={350} maxHeight={350} overflow="scroll">
        {loading || transactions.length === 0 ? (
          <ActivitySkeletonSection />
        ) : fetched ? (
          transactions
            .filter((tx) => {
              return selectedNetwork
                ? tx.chainId === chains.find((c) => c.name === selectedNetwork.name)?.id
                : true;
            })
            .map((txInfo) => <ActivitySection txInfo={txInfo} />)
        ) : (
          <Typography variant="subtitle2" textAlign="center">
            Couldn't fetch. Try again!
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
