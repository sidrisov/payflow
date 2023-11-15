import { Stack, Typography } from '@mui/material';
import { ActivityFetchResultType } from '../types/ActivityFetchResultType';
import ActivitySection from './ActivitySection';
import { ActivitySkeletonSection } from './ActivitySkeletonSection';
import { Chain } from '@rainbow-me/rainbowkit';

export type AssetsProps = {
  selectedNetwork: Chain | undefined;
  activityFetchResult: ActivityFetchResultType;
};

export default function Activity(props: AssetsProps) {
  const { selectedNetwork } = props;

  const { loading, fetched, transactions } = props.activityFetchResult;

  return (
    <Stack px={1.5} spacing={1} minWidth={350} maxHeight={350} overflow="scroll">
      {loading || transactions.length === 0 ? (
        <ActivitySkeletonSection />
      ) : fetched ? (
        transactions
          .filter((tx) => {
            return selectedNetwork ? tx.chainId === selectedNetwork.id : true;
          })
          .map((txInfo) => <ActivitySection txInfo={txInfo} />)
      ) : (
        <Typography variant="subtitle2" textAlign="center">
          Couldn't fetch. Try again!
        </Typography>
      )}
    </Stack>
  );
}
