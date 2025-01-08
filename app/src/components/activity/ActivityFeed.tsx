import { Box, Typography, Stack, CircularProgress } from '@mui/material';
import ActivityFeedEntry from './ActivityFeedEntry';
import { useAccount } from 'wagmi';
import { useContext, useMemo, useCallback, useRef, useState } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { Chain } from 'viem';
import { useCompletedPayments } from '../../utils/queries/payments';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { IdentityType, PaymentType } from '@payflow/common';
import { useTheme } from '@mui/material/styles';
import { useSearchParams } from 'react-router-dom';
import { useTokenPrices } from '../../utils/queries/prices'; // Add this import

export type AssetsProps = {
  identity: IdentityType;
  selectedChain?: Chain | undefined;
};

const formatDate = (date: Date) => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'd MMMM');
};

export default function ActivityFeed({ identity, selectedChain }: AssetsProps) {
  const theme = useTheme();
  const { profile: loggedProfile } = useContext(ProfileContext);
  const { address } = useAccount();

  const accessToken = useSearchParams()[0].get('access_token') ?? undefined;

  const { isLoading, isFetched, data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCompletedPayments(identity.address, accessToken);

  const { isLoading: isPricesLoading } = useTokenPrices(); // Add this line

  const isLoadingData = isLoading || isPricesLoading;

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  const [feedOption, setFeedOption] = useState<number>(1);

  // Ensure feedOption is set correctly based on user authentication
  useMemo(() => {
    if (!address && !loggedProfile) {
      setFeedOption(1);
    }
  }, [address, loggedProfile]);

  // Update the transactions useMemo
  const transactions: PaymentType[] = useMemo(() => {
    return data?.pages.flatMap((page) => page.content) || [];
  }, [data]);

  // Update the groupedTransactions useMemo
  const groupedTransactions = useMemo(() => {
    if (!transactions) return {};

    return transactions.reduce((groups: { [key: string]: PaymentType[] }, payment) => {
      const date = formatDate(parseISO(new Date(payment.completedAt!).toISOString()));
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(payment);
      return groups;
    }, {});
  }, [transactions]);

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack
        spacing={1}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}>
        {isLoadingData ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress color="inherit" size={24} />
          </Box>
        ) : isFetched ? (
          <>
            {Object.keys(groupedTransactions).length > 0 ? (
              <>
                {Object.entries(groupedTransactions).map(([date, payments], index, array) => (
                  <Box key={date} sx={{ position: 'relative' }}>
                    <Typography
                      textAlign="center"
                      fontSize={14}
                      sx={{
                        position: 'sticky',
                        zIndex: 2,
                        top: -1,
                        backgroundColor: theme.palette.mode === 'dark' ? '#242424' : '#f8fafc',
                        py: 0.5,
                        pb: 0.5
                      }}
                      data-date={date}>
                      {date}
                    </Typography>
                    {payments
                      .filter((payment) => {
                        const chainMatch = selectedChain
                          ? payment.chainId === selectedChain.id
                          : true;
                        const feedMatch =
                          feedOption === 1 ||
                          payment.receiverAddress === address ||
                          payment.senderAddress === address ||
                          (loggedProfile &&
                            (payment.sender?.identity === loggedProfile.identity ||
                              payment.receiver?.identity === loggedProfile.identity));
                        return chainMatch && feedMatch;
                      })
                      .map((payment, paymentIndex, filteredPayments) => (
                        <div
                          key={`activity_section_${payment.chainId}_${payment.hash}`}
                          ref={
                            index === array.length - 1 &&
                            paymentIndex === filteredPayments.length - 1
                              ? lastElementRef
                              : null
                          }>
                          <ActivityFeedEntry identity={identity} payment={payment} />
                        </div>
                      ))}
                  </Box>
                ))}
                {isFetchingNextPage && (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress color="inherit" size={24} />
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="subtitle2" textAlign="center">
                No transactions found.
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="subtitle2" textAlign="center">
            Couldn't fetch. Try again!
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
