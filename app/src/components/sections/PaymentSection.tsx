import { useRef, useEffect } from 'react';
import { Box, Stack, StackProps, CircularProgress, Skeleton } from '@mui/material';
import { PaymentStatus } from '@payflow/common';
import { useMobile } from '../../utils/hooks/useMobile';
import { useOutboundPayments } from '../../utils/queries/payments';
import { PaymentItem } from './PaymentTypes';

interface PaymentSectionProps extends StackProps {
  type: 'intent' | 'receipt';
}

const STATUS_MAP: Record<string, PaymentStatus[]> = {
  intent: ['CREATED', 'INPROGRESS', 'PENDING_REFUND'],
  receipt: ['COMPLETED', 'REFUNDED']
};

const PaymentItemSkeleton = () => {
  const isMobile = useMobile();
  return (
    <Box
      sx={{
        width: isMobile ? 145 : 155,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 5,
        p: 1.5
      }}>
      <Stack spacing={1}>
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="rounded" width="100%" height={80} />
      </Stack>
    </Box>
  );
};

export function PaymentSection({ type }: PaymentSectionProps) {
  const isMobile = useMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useOutboundPayments(
    STATUS_MAP[type]
  );

  // filter out expired payments
  const payments =
    data?.pages.flatMap((page) => page.content).filter((payment) => payment.status !== 'EXPIRED') ||
    [];

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 20 && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, STATUS_MAP[type]]);

  const renderContent = () => {
    const commonStackProps = {
      ref: scrollContainerRef,
      px: 1.5,
      pb: 1,
      pt: 0.5,
      spacing: 1,
      sx: {
        overflowY: 'scroll',
        maxHeight: 'calc(100vh - 300px)',
        scrollbarWidth: 'auto',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        '&-ms-overflow-style:': {
          display: 'none'
        },
        '-webkit-overflow-scrolling': 'touch'
      }
    };

    if (isLoading) {
      return (
        <Stack {...commonStackProps}>
          {[...Array(2)].map((_, index) => (
            <PaymentItemSkeleton key={`skeleton_${index}`} />
          ))}
        </Stack>
      );
    }

    if (!payments || payments.length === 0) return null;

    return (
      <Stack {...commonStackProps}>
        {payments.map((payment, index) => (
          <PaymentItem key={`${type}_payment_${index}`} payment={payment} />
        ))}
        {(hasNextPage || isFetchingNextPage) && (
          <Box
            sx={{
              p: 3,
              minWidth: isMobile ? 145 : 155,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            <CircularProgress color="inherit" size={24} />
          </Box>
        )}
      </Stack>
    );
  };

  return <>{renderContent()}</>;
}
