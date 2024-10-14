import React from 'react';
import ResponsiveDialog from './ResponsiveDialog';
import { Box, Typography, Link, Button } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { green } from '@mui/material/colors';
import { HiOutlineCheckCircle } from 'react-icons/hi2';

interface PaymentSuccessDialogProps {
  open?: boolean;
  onClose?: () => void;
  message: string;
  receiptUrl: string;
  shareComponents?: React.ReactNode;
}

export default function PaymentSuccessDialog({
  open = true,
  onClose = () => {
    window.location.href = '/';
  },
  message,
  receiptUrl,
  shareComponents
}: PaymentSuccessDialogProps) {
  return (
    <ResponsiveDialog open={open} onClose={onClose}>
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={1}>
        <HiOutlineCheckCircle style={{ fontSize: 65, color: green.A700, marginBottom: 1 }} />
        <Typography fontSize={18} fontWeight="bold" textAlign="center" mb={1}>
          Completed
        </Typography>
        <Typography fontSize={18} textAlign="center" mb={2} sx={{ color: 'text.secondary' }}>
          {message}
        </Typography>
        {shareComponents && (
          <Box
            mb={2}
            sx={{
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 5,
              p: 2,
              pt: 1.5,
              width: '100%'
            }}>
            <Typography mb={1} textAlign="center" variant="body2" color="text.secondary">
              Share on socials
            </Typography>
            {shareComponents}
          </Box>
        )}
        <Typography
          mb={2}
          variant="caption"
          textAlign="center"
          sx={{ color: 'text.secondary', whiteSpace: 'balance' }}>
          You can view the payment details in the receipts section or{' '}
          <Link
            href={receiptUrl}
            target="_blank"
            color="inherit"
            sx={{ display: 'inline-flex', alignItems: 'center' }}>
            click here <OpenInNewIcon sx={{ fontSize: 12, ml: 0.5 }} />
          </Link>
        </Typography>

        <Button
          fullWidth
          size="large"
          variant="outlined"
          onClick={onClose}
          color="inherit"
          sx={{ borderRadius: 4 }}>
          Return to home page
        </Button>
      </Box>
    </ResponsiveDialog>
  );
}
