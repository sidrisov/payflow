import React from 'react';
import ResponsiveDialog from './ResponsiveDialog';
import { Box, Typography, Link } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { green } from '@mui/material/colors';

interface PaymentSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  message: string;
  receiptUrl: string;
}

const PaymentSuccessDialog: React.FC<PaymentSuccessDialogProps> = ({
  open,
  onClose,
  message,
  receiptUrl
}) => {
  return (
    <ResponsiveDialog open={open} onClose={onClose}>
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={2}>
        <CheckCircleIcon sx={{ fontSize: 80, color: green.A700, mb: 2 }} />
        <Typography variant="h6" textAlign="center" mb={1} sx={{ fontWeight: 'bold' }}>
          Payment Successful!
        </Typography>
        <Typography variant="h6" textAlign="center" mb={2} sx={{ color: 'gray' }}>
          {message}
        </Typography>
        <Typography
          variant="body2"
          textAlign="center"
          mb={1}
          sx={{ color: 'gray', whiteSpace: 'balance' }}>
          You can view the payment details in the receipts section or{' '}
          <Link
            href={receiptUrl}
            target="_blank"
            color="inherit"
            sx={{ display: 'inline-flex', alignItems: 'center' }}>
            click here <OpenInNewIcon sx={{ fontSize: 14, ml: 0.5 }} />
          </Link>
        </Typography>
      </Box>
    </ResponsiveDialog>
  );
};

export default PaymentSuccessDialog;
