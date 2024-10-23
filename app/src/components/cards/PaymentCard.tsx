import React, { useState } from 'react';
import { Box, BoxProps, Button, IconButton, Tooltip, Typography, Stack } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { PaymentType } from '../../types/PaymentType';
import { PaymentMenu } from '../menu/PaymentMenu';
import { useMobile } from '../../utils/hooks/useMobile';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineCheckCircle,
  HiQuestionMarkCircle,
  HiOutlineReceiptRefund
} from 'react-icons/hi2';
import { green } from '@mui/material/colors';
import { TbProgressCheck } from 'react-icons/tb';

interface PaymentCardProps extends BoxProps {
  payment: PaymentType;
  title: string;
  children: React.ReactNode;
}

export function PaymentCard({ payment, title, children, ...props }: PaymentCardProps) {
  const [openPaymentMenu, setOpenPaymentMenu] = useState(false);
  const [paymentMenuAnchorEl, setPaymentMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isMobile = useMobile();
  const navigate = useNavigate();

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setPaymentMenuAnchorEl(event.currentTarget);
    setOpenPaymentMenu(true);
  };

  const handleMenuClose = () => {
    setOpenPaymentMenu(false);
  };

  const renderStatusIcon = () => {
    switch (payment.status) {
      case 'CREATED':
        return <></>;
      case 'INPROGRESS':
        return <TbProgressCheck size={20} />;
      case 'PENDING_REFUND':
        return <HiOutlineReceiptRefund size={20} />;
      case 'REFUNDED':
        return <HiOutlineReceiptRefund size={20} style={{ color: green.A700 }} />;
      case 'COMPLETED':
        return <HiOutlineCheckCircle size={20} style={{ color: green.A700 }} />;
      default:
        return <HiQuestionMarkCircle size={20} />;
    }
  };

  const getStatusTooltip = () => {
    switch (payment.status) {
      case 'COMPLETED':
        return 'Completed';
      case 'CREATED':
        return 'Pending';
      case 'INPROGRESS':
        return 'In-progress';
      case 'REFUNDED':
        return 'Refunded';
      case 'PENDING_REFUND':
        return 'Pending refund';
      default:
        return 'Unknown status';
    }
  };

  return (
    <>
      <Box
        {...((payment.status === 'CREATED' || payment.status === 'COMPLETED') && {
          component: Button,
          variant: 'text',
          textTransform: 'none',
          onClick: () => {
            navigate(`/payment/${payment.referenceId}`);
          }
        })}
        sx={{
          p: 1.5,
          border: 1,
          borderRadius: 5,
          borderColor: 'divider',
          minWidth: isMobile ? 145 : 155,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          gap: 1,
          color: 'inherit',
          '&:hover': {
            backgroundColor: 'inherit',
            border: 1
          }
        }}
        {...props}>
        <Box
          alignSelf="stretch"
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-start"
            spacing={0.5}
            sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box
              sx={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              <Tooltip title={getStatusTooltip()}>{renderStatusIcon()}</Tooltip>
            </Box>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              fontSize={14}
              noWrap
              sx={{
                flexGrow: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
              fasdf asdf asd fasf
            </Typography>
          </Stack>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVert sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
        {children}
      </Box>
      {openPaymentMenu && (
        <PaymentMenu
          open={openPaymentMenu}
          payment={payment}
          anchorEl={paymentMenuAnchorEl}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
        />
      )}
    </>
  );
}
