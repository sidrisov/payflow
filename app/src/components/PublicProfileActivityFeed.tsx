import { Box, NativeSelect, Stack, Typography } from '@mui/material';
import { ActivityFetchResultType } from '../types/ActivityFetchResultType';
import { ActivitySkeletonSection } from './ActivitySkeletonSection';
import PublicProfileActivityFeedSection from './PublicProfileActivityFeedSection';
import { useAccount } from 'wagmi';
import { useContext, useMemo, useState } from 'react';
import { AnonymousUserContext } from '../contexts/UserContext';
import { Chain } from 'viem';

export type AssetsProps = {
  selectedChain?: Chain | undefined;
  activityFetchResult: ActivityFetchResultType;
};

export default function PublicProfileActivityFeed(props: AssetsProps) {
  const { profile } = useContext(AnonymousUserContext);
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
      </Box>
      <Stack p={1} spacing={2} width="100%" maxHeight={425} overflow="auto">
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
                key={`activity_section_${txInfo.hash}`}
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
