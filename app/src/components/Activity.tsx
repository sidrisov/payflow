import { Stack, Typography } from '@mui/material';
import { ActivityFetchResultType } from '../types/ActivityFetchResultType';
import ActivitySection from './ActivitySection';
import { ActivitySkeletonSection } from './skeletons/ActivitySkeletonSection';
import { Chain } from 'viem';

export type AssetsProps = {
  selectedNetwork: Chain | undefined;
  activityFetchResult: ActivityFetchResultType;
};

export default function Activity(props: AssetsProps) {
  const { selectedNetwork } = props;
  const { isLoading: loading, isFetched: fetched, transactions } = props.activityFetchResult;

  return (
    <Stack pt={1} px={1} spacing={2} width="100%" maxHeight={430} overflow="auto">
      {loading ? (
        <ActivitySkeletonSection />
      ) : fetched && transactions ? (
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
