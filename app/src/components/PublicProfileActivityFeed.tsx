import { Box, NativeSelect, Stack, Typography } from '@mui/material';
import { ActivitySkeletonSection } from './skeletons/ActivitySkeletonSection';
import PublicProfileActivityFeedSection from './PublicProfileActivityFeedSection';
import { useAccount } from 'wagmi';
import { useContext, useMemo, useState } from 'react';
import { ProfileContext } from '../contexts/UserContext';
import { Chain } from 'viem';
import { ProfileType } from '../types/ProfleType';
import { useTransactions } from '../utils/queries/transactions';

export type AssetsProps = {
  selectedChain?: Chain | undefined;
  profile: ProfileType;
};

export default function PublicProfileActivityFeed({ profile, selectedChain }: AssetsProps) {
  const { profile: loggedProfile } = useContext(ProfileContext);
  const { address } = useAccount();

  const {
    isLoading,
    isFetched,
    data: transactions
  } = useTransactions(profile?.defaultFlow?.wallets ?? []);

  const [feedOption, setFeedOption] = useState<number>(1);

  useMemo(async () => {
    if (!address && !loggedProfile) {
      setFeedOption(1);
    }
  }, [address, loggedProfile]);

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
          {(address || loggedProfile) && <option value={2}>Between you</option>}
        </NativeSelect>
      </Box>
      <Stack p={1} spacing={2} width="100%" maxHeight={430} overflow="auto">
        {isLoading ? (
          <ActivitySkeletonSection />
        ) : isFetched && transactions ? (
          transactions
            .filter((tx) => {
              return (
                (selectedChain ? tx.chainId === selectedChain.id : true) &&
                (feedOption !== 1
                  ? tx.to === address ||
                    tx.from === address ||
                    (loggedProfile &&
                      (tx.fromProfile?.identity === loggedProfile.identity ||
                        tx.toProfile?.identity === loggedProfile.identity))
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
