import React, { useState } from 'react';
import {
  Box,
  BoxProps,
  Button,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress
} from '@mui/material';
import { MoreHoriz } from '@mui/icons-material';
import { PaymentType } from '../../types/PaymentType';
import { PaymentMenu } from '../menu/PaymentMenu';
import { useMobile } from '../../utils/hooks/useMobile';
import { useNavigate } from 'react-router-dom';

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

  return (
    <>
      <Box
        {...((payment.status === 'PENDING' ||
          (payment.status === 'COMPLETED' && payment.category === 'mint')) && {
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
            border: 1,
            borderStyle: 'dashed'
          }
        }}
        {...props}>
        <Box
          alignSelf="stretch"
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between">
          {payment.status === 'INPROGRESS' && (
            <Tooltip title="Payment in-progress">
              <CircularProgress color="inherit" size={20} />
            </Tooltip>
          )}
          <Typography variant="subtitle2" fontWeight="bold" fontSize={14}>
            {title}
          </Typography>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreHoriz fontSize="small" />
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
