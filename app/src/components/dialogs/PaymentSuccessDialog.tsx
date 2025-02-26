import React, { useContext } from 'react';
import ResponsiveDialog from './ResponsiveDialog';
import { Box, Typography, Link, Button, Stack, Divider } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { green } from '@mui/material/colors';
import { HiOutlineCheckCircle } from 'react-icons/hi2';
import { useNavigate } from 'react-router';
import { FcApproval } from 'react-icons/fc';
import { FaRegHeart } from 'react-icons/fa6';
import FrameV2SDK from '@farcaster/frame-sdk';
import { ProfileContext } from '../../contexts/UserContext';

interface PaymentSuccessDialogProps {
  open?: boolean;
  onClose?: () => void;
  message: string;
  receiptUrl: string;
  shareComponents?: React.ReactNode;
  completedAt?: Date;
}

const hyperSubUrl = 'https://hypersub.xyz/s/payflow-pro-17zbymgz59atc';

export default function PaymentSuccessDialog({
  open = true,
  onClose = () => {
    window.location.href = '/';
  },
  message,
  receiptUrl,
  shareComponents,
  completedAt
}: PaymentSuccessDialogProps) {
  const navigate = useNavigate();
  const { isFrameV2 } = useContext(ProfileContext);

  return (
    <ResponsiveDialog open={open} onClose={onClose}>
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={1}>
        <HiOutlineCheckCircle style={{ fontSize: 65, color: green.A700, marginBottom: 1 }} />
        <Typography fontSize={18} fontWeight="bold" textAlign="center">
          Completed
        </Typography>
        {completedAt && (
          <Typography fontSize={14} textAlign="center" mb={1} sx={{ color: 'text.secondary' }}>
            {completedAt.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }) +
              ' ' +
              completedAt.toLocaleTimeString()}
          </Typography>
        )}

        <Typography fontSize={18} textAlign="center" my={1} sx={{ color: 'text.secondary' }}>
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
            {...(isFrameV2
              ? {
                  onClick: () => FrameV2SDK.actions.openUrl(receiptUrl)
                }
              : {
                  href: receiptUrl,
                  target: '_blank'
                })}
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
            width: '100%'
          }}>
          <Typography mb={1} textAlign="center" variant="body2" color="text.secondary">
            How to support Payflow?
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              onClick={() => {
                navigate('/payment/create?recipient=0x0dEe77c83cB8b14fA95497825dF93202AbF6ad83');
              }}
              startIcon={<FaRegHeart size={16} />}
              variant="outlined"
              size="small"
              color="inherit"
              sx={{
                fontSize: 14,
                fontWeight: 'normal',
                height: 45,
                '&:hover': { backgroundColor: 'action.hover' },
                borderRadius: 3,
                borderColor: 'divider',
                textTransform: 'none'
              }}>
              TIP
            </Button>
            <Button
              fullWidth
              {...(isFrameV2
                ? {
                    onClick: () => FrameV2SDK.actions.openUrl(hyperSubUrl)
                  }
                : {
                    href: hyperSubUrl,
                    target: '_blank'
                  })}
              startIcon={<FcApproval size={20} />}
              variant="outlined"
              size="small"
              color="inherit"
              sx={{
                fontSize: 14,
                fontWeight: 'normal',
                height: 45,
                '&:hover': { backgroundColor: 'action.hover' },
                borderRadius: 3,
                borderColor: 'divider',
                textTransform: 'none'
              }}>
              SUBSCRIBE
            </Button>
          </Stack>
        </Box>
      </Box>
    </ResponsiveDialog>
  );
}
