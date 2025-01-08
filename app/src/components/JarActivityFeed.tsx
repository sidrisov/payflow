import { Box, NativeSelect, Stack, Typography } from '@mui/material';
import { ActivitySkeletonSection } from './skeletons/ActivitySkeletonSection';
import { useState } from 'react';
import { Chain } from 'viem';
import { useTransactions } from '../utils/queries/transactions';
import { FlowType } from '@payflow/common';

export type AssetsProps = {
  flow: FlowType | undefined;
  selectedChain?: Chain | undefined;
};

export default function JarActivityFeed({ flow, selectedChain }: AssetsProps) {
  const { isLoading, isFetched, data: transactions } = useTransactions(flow?.wallets ?? []);
  const [feedOption, setFeedOption] = useState<number>(1);

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
          <option value={1}>Contributions</option>
          <option value={2}>Withdrawals</option>
        </NativeSelect>
      </Box>
      <Stack p={1} spacing={2} width="100%" maxHeight={430} overflow="auto">
        {isLoading ? (
          <ActivitySkeletonSection />
        ) : isFetched ? (
          transactions &&
          transactions
            .filter((tx) => {
              return (
                (selectedChain ? tx.chainId === selectedChain.id : true) &&
                (feedOption === 1 ? tx.activity === 'inbound' : tx.activity === 'outbound')
              );
            })
            .map((_) => (
              /*               <PublicProfileActivityFeedSection
                key={`activity_section_${txInfo.chainId}_${txInfo.hash}`}
                //txInfo={txInfo!}
              /> */ <></>
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
