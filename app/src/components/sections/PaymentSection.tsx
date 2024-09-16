import React, { useState } from 'react';
import { Box, Chip, IconButton, Stack, StackProps, Button, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { MdOutlinePlaylistAdd, MdOutlinePlaylistAddCheck } from 'react-icons/md';
import { PaymentType } from '../../types/PaymentType';
import { useMobile } from '../../utils/hooks/useMobile';
import calculateMaxPages from '../../utils/pagination';
import { PaymentItem } from './PaymentTypes';

const PAGE_SIZE = 5;

interface PaymentSectionProps extends StackProps {
  payments?: PaymentType[];
  type: 'intent' | 'receipt';
  renderPayment: (payment: PaymentType, index: number) => React.ReactNode;
}

export function PaymentSection({ payments, type, renderPayment, ...props }: PaymentSectionProps) {
  const isMobile = useMobile();
  const [expand, setExpand] = useState<boolean>(type === 'intent');
  const [page, setPage] = useState<number>(1);

  if (!payments) return null;

  const maxPages = calculateMaxPages(payments.length, PAGE_SIZE);
  const icon =
    type === 'intent' ? (
      <MdOutlinePlaylistAdd color="inherit" fontSize="large" />
    ) : (
      <MdOutlinePlaylistAddCheck color="inherit" fontSize="large" />
    );
  const label = type === 'intent' ? 'Intents' : 'Receipts';

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
          label={`${label} (${payments.length})`}
          variant="outlined"
          sx={{ border: 0, fontSize: 14, fontWeight: 'bold' }}
        />
        <IconButton size="small" color="inherit" onClick={() => setExpand(!expand)}>
          {expand ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      {expand && (
        <Stack
          px={1.5}
          pb={1}
          pt={0.5}
          direction="row"
          spacing={3}
          sx={{
            overflowX: 'scroll',
            scrollbarWidth: 'auto',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            '&-ms-overflow-style:': {
              display: 'none'
            },
            '-webkit-overflow-scrolling': 'touch'
          }}>
          {payments
            .slice(0, page * PAGE_SIZE)
            .map((payment, index) => renderPayment(payment, index))}
          {page < maxPages && (
            <Button
              color="inherit"
              size="small"
              onClick={() => setPage(page + 1)}
              sx={{
                p: 3,
                minWidth: isMobile ? 145 : 155,
                textTransform: 'none',
                borderRadius: 5
              }}>
              <Typography variant="subtitle2">More {label.toLowerCase()}</Typography>
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}

interface PaymentListSectionProps extends StackProps {
  payments?: PaymentType[];
  type: 'intent' | 'receipt';
}

export function PaymentListSection({ payments, type, ...props }: PaymentListSectionProps) {
  return (
    payments && (
      <PaymentSection
        payments={payments}
        type={type}
        {...props}
        renderPayment={(payment: PaymentType, index: number) => (
          <PaymentItem key={`${type}_payment_${index}`} payment={payment} />
        )}
      />
    )
  );
}
