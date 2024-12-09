import React from 'react';
import ResponsiveDialog from './ResponsiveDialog';
import { Box, Typography, Link, Button } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { green } from '@mui/material/colors';
import { HiOutlineCheckCircle } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { FcApproval } from 'react-icons/fc';
import { FaRegHeart } from 'react-icons/fa6';

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
  const navigate = useNavigate();

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

        <Box
          mb={2}
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 5,
            p: 2,
            pt: 1.5,
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
          <Typography mb={1} variant="body2" color="text.secondary">
            Support Payflow
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              gap: 1
            }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FaRegHeart size={16} />}
              onClick={() =>
                navigate('/payment/create?recipient=0x0dEe77c83cB8b14fA95497825dF93202AbF6ad83')
              }
              color="inherit"
              sx={{ borderRadius: 4 }}>
              Tip
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FcApproval size={20} />}
              onClick={() => {
                window.open('https://hypersub.xyz/s/payflow-pro-17zbymgz59atc', '_blank');
              }}
              color="inherit"
              sx={{ borderRadius: 4 }}>
              Subscribe
            </Button>
          </Box>
        </Box>
      </Box>
    </ResponsiveDialog>
  );
}
