import { Stack, Typography } from '@mui/material';
import { ActivityFetchResultType } from '../types/ActivityFetchResultType';
import ActivitySection from './ActivitySection';
import { ActivitySkeletonSection } from './ActivitySkeletonSection';
import { Chain } from 'viem';

export type AssetsProps = {
  selectedNetwork: Chain | undefined;
  activityFetchResult: ActivityFetchResultType;
};

export default function Activity(props: AssetsProps) {
  const { selectedNetwork } = props;
  const { loading, fetched, transactions } = props.activityFetchResult;

  return (
    <Stack pt={1} px={1} spacing={2} width="100%" maxHeight={350} overflow="auto">
      {loading || transactions.length === 0 ? (
        <ActivitySkeletonSection />
      ) : fetched ? (
        transactions
          .filter((tx) => {
            return selectedNetwork ? tx.chainId === selectedNetwork.id : true;
          })
          .map((txInfo) => (
            <ActivitySection key={`activity_section_${txInfo.hash}`} txInfo={txInfo} />
          ))
      ) : (
        <Typography variant="subtitle2" textAlign="center">
          Couldn't fetch. Try again!
        </Typography>
      )}
    </Stack>
  );
}
