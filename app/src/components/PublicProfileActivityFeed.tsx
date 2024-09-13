import { Box, NativeSelect, Stack, Typography } from '@mui/material';
import { ActivitySkeletonSection } from './skeletons/ActivitySkeletonSection';
import PublicProfileActivityFeedSection from './PublicProfileActivityFeedPayment';
import { useAccount } from 'wagmi';
import { useContext, useMemo, useState } from 'react';
import { ProfileContext } from '../contexts/UserContext';
import { Chain } from 'viem';
import { useCompletedPayments } from '../utils/queries/payments';
import { PaymentType } from '../types/PaymentType';
import { ERC20_CONTRACTS } from '../utils/erc20contracts';
import { TxInfo, TxToken } from '../types/ActivityFetchResultType';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { IdentityType } from '../types/ProfileType';

export type AssetsProps = {
  identity: IdentityType;
  selectedChain?: Chain | undefined;
};

export default function PublicProfileActivityFeed({ identity, selectedChain }: AssetsProps) {
  const { profile: loggedProfile } = useContext(ProfileContext);
  const { address } = useAccount();

  const { isLoading, isFetched, data: payments } = useCompletedPayments(identity.address);

  const [feedOption, setFeedOption] = useState<number>(1);

  // Ensure feedOption is set correctly based on user authentication
  useMemo(() => {
    if (!address && !loggedProfile) {
      setFeedOption(1);
    }
  }, [address, loggedProfile]);

  // Conversion function to map PaymentType to TxInfo
  const paymentToTxInfo = (payment: PaymentType): TxInfo => {
    console.log('Payment: ', payment);
    // Find the token details from ERC20_CONTRACTS using token address
    const token = ERC20_CONTRACTS.find((t) => t.id?.toLowerCase() === payment.token.toLowerCase());

    let activity: 'inbound' | 'outbound' | 'self';
    if (
      payment.senderAddress === payment.receiverAddress ||
      payment.receiver?.identity === loggedProfile?.identity
    ) {
      activity = 'self';
    } else if (payment.sender?.identity === loggedProfile?.identity) {
      activity = 'outbound';
    } else if (payment.receiver?.identity === loggedProfile?.identity) {
      activity = 'inbound';
    } else {
      activity = 'outbound'; // Default to outbound if unable to determine
    }

    const txInfo = {
      chainId: payment.chainId,
      hash: payment.hash!,
      from: payment.senderAddress || payment.sender.identity,
      to: payment.receiverAddress || payment.receiver.identity,
      fromProfile: payment.sender,
      toProfile: payment.receiver,
      token:
        token! &&
        ({
          address: token.tokenAddress || '',
          decimals: token.decimals,
          symbol: token.id,
          name: token.name,
          exchange_rate: 0,
          type: 'erc20'
        } as TxToken),
      value: payment.tokenAmount,
      payment,
      timestamp: payment.completedAt!,
      success: true,
      type: 'transfer',
      activity,
      block: 0
    } as TxInfo;
    console.log('TxInfo: ', txInfo);

    return txInfo;
  };

  // Convert payments to transactions using useMemo for performance
  const transactions: TxInfo[] = useMemo(() => {
    return payments ? payments.filter((p) => !p.category).map(paymentToTxInfo) : [];
  }, [payments]);

  // Function to format the date
  const formatDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'd MMMM');
  };

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    if (!transactions) return {};

    return transactions.reduce((groups: { [key: string]: TxInfo[] }, tx) => {
      const date = formatDate(parseISO(new Date(tx.timestamp).toISOString()));
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(tx);
      return groups;
    }, {});
  }, [transactions]);

  return (
    <Box display="flex" flexDirection="column" height="100%">
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
      <Stack p={1} spacing={2} width="100%" flexGrow={1} overflow="auto">
        {isLoading ? (
          <ActivitySkeletonSection />
        ) : isFetched ? (
          Object.keys(groupedTransactions).length > 0 ? (
            Object.entries(groupedTransactions).map(([date, txs]) => (
              <Box key={date}>
                <Typography variant="body2" textAlign="center" sx={{ mb: 1 }}>
                  {date}
                </Typography>
                {txs
                  .filter((tx) => {
                    const chainMatch = selectedChain ? tx.chainId === selectedChain.id : true;
                    const feedMatch =
                      feedOption === 1 ||
                      tx.to === address ||
                      tx.from === address ||
                      (loggedProfile &&
                        (tx.fromProfile?.identity === loggedProfile.identity ||
                          tx.toProfile?.identity === loggedProfile.identity));
                    return chainMatch && feedMatch;
                  })
                  .map((txInfo) => (
                    <PublicProfileActivityFeedSection
                      key={`activity_section_${txInfo.chainId}_${txInfo.hash}`}
                      txInfo={txInfo}
                    />
                  ))}
              </Box>
            ))
          ) : (
            <Typography variant="subtitle2" textAlign="center">
              No transactions found.
            </Typography>
          )
        ) : (
          <Typography variant="subtitle2" textAlign="center">
            Couldn't fetch. Try again!
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
