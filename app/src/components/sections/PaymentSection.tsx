import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  StackProps,
  CircularProgress,
  Skeleton} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { MdOutlinePlaylistAdd, MdOutlinePlaylistAddCheck } from 'react-icons/md';
import { PaymentStatus } from '../../types/PaymentType';
import { useMobile } from '../../utils/hooks/useMobile';
import { useOutboundPayments } from '../../utils/queries/payments';
import { PaymentItem } from './PaymentTypes';

interface PaymentSectionProps extends StackProps {
  type: 'intent' | 'receipt';
}

const STATUS_MAP: Record<string, PaymentStatus[]> = {
  intent: ['PENDING', 'INPROGRESS'],
  receipt: ['COMPLETED']
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

export function PaymentSection({ type, ...props }: PaymentSectionProps) {
  const isMobile = useMobile();
  const [expand, setExpand] = useState<boolean>(type === 'intent');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useOutboundPayments(
    STATUS_MAP[type]
  );

  const payments = data?.pages.flatMap((page) => page.content) || [];

  const icon =
    type === 'intent' ? (
      <MdOutlinePlaylistAdd color="inherit" fontSize="large" />
    ) : (
      <MdOutlinePlaylistAddCheck color="inherit" fontSize="large" />
    );
  const label = type === 'intent' ? 'Intents' : 'Receipts';

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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderContent = () => {
    const commonStackProps = {
      ref: scrollContainerRef,
      px: 1.5,
      pb: 1,
      pt: 0.5,
      direction: 'row' as const,
      spacing: 3,
      sx: {
        overflowX: 'scroll',
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

  return (
    <Stack {...props} px={1} spacing={1}>
      <Box
        px={0.5}
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center">
        <Chip
          icon={icon}
          label={
            <Box display="flex" alignItems="center">
              {label} (
              {isLoading ? (
                <Skeleton width={20} sx={{ display: 'inline-block', mx: 0.5 }} />
              ) : (
                payments.length
              )}
              )
            </Box>
          }
          variant="outlined"
          sx={{ border: 0, fontSize: 14, fontWeight: 'bold' }}
        />
        <IconButton size="small" color="inherit" onClick={() => setExpand(!expand)}>
          {expand ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      {expand && renderContent()}
    </Stack>
  );
}
