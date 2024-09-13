import { Box, Typography, Stack, CircularProgress } from '@mui/material';
import PublicProfileActivityFeedSection from './PublicProfileActivityFeedPayment';
import { useAccount } from 'wagmi';
import { useContext, useMemo, useCallback, useRef, useState } from 'react';
import { ProfileContext } from '../contexts/UserContext';
import { Chain } from 'viem';
import { useCompletedPayments } from '../utils/queries/payments';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { IdentityType } from '../types/ProfileType';
import { TxInfo, TxToken } from '../types/ActivityFetchResultType';
import { ERC20_CONTRACTS } from '../utils/erc20contracts';
import { PaymentType } from '../types/PaymentType';
import { useTheme } from '@mui/material/styles';

export type AssetsProps = {
  identity: IdentityType;
  selectedChain?: Chain | undefined;
};

export default function PublicProfileActivityFeed({ identity, selectedChain }: AssetsProps) {
  const theme = useTheme();
  const { profile: loggedProfile } = useContext(ProfileContext);
  const { address } = useAccount();
  const [currentDate, setCurrentDate] = useState<string>('');
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const lastScrollTop = useRef(0);

  const { isLoading, isFetched, data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCompletedPayments(identity.address);

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

  // Conversion function to map PaymentType to TxInfo
  const paymentToTxInfo = (payment: PaymentType): TxInfo => {
    console.log('Payment: ', payment);
    // Find the token details from ERC20_CONTRACTS using token address
    const token = ERC20_CONTRACTS.find((t) => t.id?.toLowerCase() === payment.token.toLowerCase());

    let activity: 'inbound' | 'outbound' | 'self';
    if (
      payment.senderAddress === payment.receiverAddress ||
      payment.sender?.identity === payment.receiver?.identity
    ) {
      activity = 'self';
    } else if (payment.sender?.identity === identity.address) {
      activity = 'outbound';
    } else if (payment.receiver?.identity === identity.address) {
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
    return (
      data?.pages.flatMap((page) => page.content.filter((p) => !p.category).map(paymentToTxInfo)) ||
      []
    );
  }, [data]);

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

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.target as HTMLDivElement;
      const scrollTop = target.scrollTop;
      const dateElements = Array.from(target.querySelectorAll('[data-date]'));

      // Determine scroll direction
      if (scrollTop > lastScrollTop.current) {
        setScrollDirection('down');
      } else if (scrollTop < lastScrollTop.current) {
        setScrollDirection('up');
      }
      lastScrollTop.current = scrollTop;

      let topVisibleDateIndex = -1;
      for (let i = 0; i < dateElements.length; i++) {
        const rect = dateElements[i].getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
          topVisibleDateIndex = i;
          break;
        }
      }

      if (topVisibleDateIndex !== -1) {
        if (scrollDirection === 'down') {
          if (topVisibleDateIndex < dateElements.length - 1) {
            setCurrentDate(dateElements[topVisibleDateIndex + 1].getAttribute('data-date') || '');
          } else {
            setCurrentDate('');
          }
        } else if (scrollDirection === 'up') {
          if (topVisibleDateIndex > 0) {
            setCurrentDate(dateElements[topVisibleDateIndex - 1].getAttribute('data-date') || '');
          } else {
            setCurrentDate('');
          }
        }
      } else if (scrollTop === 0) {
        setCurrentDate('');
      }
    },
    [scrollDirection]
  );

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Stack
        spacing={2}
        width="100%"
        flexGrow={1}
        onScroll={handleScroll}
        sx={{
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : isFetched ? (
          <>
            {Object.keys(groupedTransactions).length > 0 ? (
              <>
                {Object.entries(groupedTransactions).map(([date, txs], index, array) => (
                  <Box key={date} sx={{ position: 'relative' }}>
                    <Typography
                      variant="body2"
                      textAlign="center"
                      sx={{
                        position: 'sticky',
                        zIndex: 2,
                        top: -1,
                        backgroundColor: theme.palette.mode === 'dark' ? '#242424' : '#f8fafc'
                      }}
                      data-date={date}>
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
                      .map((txInfo, txIndex, filteredTxs) => (
                        <div
                          key={`activity_section_${txInfo.chainId}_${txInfo.hash}`}
                          ref={
                            index === array.length - 1 && txIndex === filteredTxs.length - 1
                              ? lastElementRef
                              : null
                          }>
                          <PublicProfileActivityFeedSection txInfo={txInfo} />
                        </div>
                      ))}
                  </Box>
                ))}
                {isFetchingNextPage && (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
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
