import { Box, NativeSelect, Stack, Typography } from '@mui/material';
import { ActivityFetchResultType } from '../types/ActivityFetchResultType';
import { ActivitySkeletonSection } from './skeletons/ActivitySkeletonSection';
import PublicProfileActivityFeedSection from './PublicProfileActivityFeedSection';
import { useAccount } from 'wagmi';
import { useContext, useMemo, useState } from 'react';
import { ProfileContext } from '../contexts/UserContext';
import { Chain } from 'viem';

export type AssetsProps = {
  selectedChain?: Chain | undefined;
  activityFetchResult: ActivityFetchResultType;
};

export default function PublicProfileActivityFeed(props: AssetsProps) {
  const { profile } = useContext(ProfileContext);
  const { address } = useAccount();

  const { selectedChain } = props;
  const { loading, fetched, transactions } = props.activityFetchResult;

  const [feedOption, setFeedOption] = useState<number>(1);

  useMemo(async () => {
    if (!address && !profile) {
      setFeedOption(1);
    }
  }, [address, profile]);

  return (
    <>
      <Box
        mt={3}
        ml={2}
        mr={1}
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between">
        <Typography variant="subtitle2">Activity feed</Typography>
        {address !== profile?.identity ? (
          <NativeSelect
            variant="outlined"
            disableUnderline
            value={feedOption}
            onChange={(event) => {
              setFeedOption(parseInt(event.target.value));
            }}
            sx={{ fontSize: 14, fontWeight: 500 }}>
            <option value={1}>All payments</option>
            {(address || profile) && <option value={2}>Between you</option>}
          </NativeSelect>
        ) : (
          <Typography mr={1} variant="subtitle2">
            Your Payments
          </Typography>
        )}
      </Box>
      <Stack p={1} spacing={2} width="100%" maxHeight={430} overflow="auto">
        {loading ? (
          <ActivitySkeletonSection />
        ) : fetched ? (
          transactions
            .filter((tx) => {
              return (
                (selectedChain ? tx.chainId === selectedChain.id : true) &&
                (feedOption !== 1
                  ? tx.to === address ||
                    tx.from === address ||
                    (profile &&
                      (tx.fromProfile?.identity === profile.identity ||
                        tx.toProfile?.identity === profile.identity))
                  : true)
              );
            })
            .map((txInfo) => (
              <PublicProfileActivityFeedSection
                key={`activity_section_${txInfo.chainId}_${txInfo.hash}`}
                txInfo={txInfo}
              />
            ))
        ) : (
          <Typography variant="subtitle2" textAlign="center">
            Couldn't fetch. Try again!
          </Typography>
        )}
      </Stack>
    </>
  );
}
