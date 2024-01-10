import { Stack, Typography } from '@mui/material';
import { ActivityFetchResultType } from '../types/ActivityFetchResultType';
import { ActivitySkeletonSection } from './ActivitySkeletonSection';
import { Chain } from '@rainbow-me/rainbowkit';
import PublicProfileActivityFeedSection from './PublicProfileActivityFeedSection';

export type AssetsProps = {
  selectedNetwork: Chain | undefined;
  activityFetchResult: ActivityFetchResultType;
};

export default function PublicProfileActivityFeed(props: AssetsProps) {
  const { selectedNetwork } = props;
  const { loading, fetched, transactions } = props.activityFetchResult;

  return (
    <Stack py={1} px={1} spacing={2} width="100%" maxHeight={375} overflow="auto">
      {loading ? (
        <ActivitySkeletonSection />
      ) : fetched ? (
        transactions.length === 0 ? (
          <Typography variant="subtitle2" textAlign="center">
            Profile hasn't transacted yet.
          </Typography>
        ) : (
          transactions
            .filter((tx) => {
              return selectedNetwork ? tx.chainId === selectedNetwork.id : true;
            })
            .map((txInfo) => (
              <PublicProfileActivityFeedSection
                key={`activity_section_${txInfo.hash}`}
                txInfo={txInfo}
              />
            ))
        )
      ) : (
        <Typography variant="subtitle2" textAlign="center">
          Couldn't fetch. Try again!
        </Typography>
      )}
    </Stack>
  );
}
