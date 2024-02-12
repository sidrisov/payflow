import {
  Avatar,
  Button,
  Dialog,
  DialogContent,
  DialogProps,
  DialogTitle,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { AccountBalanceWallet } from '@mui/icons-material';

export type ChoosePaymentOptionDialogProps = DialogProps &
  CloseCallbackType & {
    setPaymentMethod: React.Dispatch<React.SetStateAction<'payflow' | 'wallet' | 'none'>>;
  } & { setOpenSearchIdentity?: React.Dispatch<React.SetStateAction<boolean>> };

const paymentOptionButton = (
  option: 'payflow' | 'wallet',
  setPaymentMethod: React.Dispatch<React.SetStateAction<'payflow' | 'wallet' | 'none'>>
) => (
  <Button
    fullWidth
    variant="outlined"
    size="small"
    color="inherit"
    onClick={() => {
      setPaymentMethod(option);
    }}
    sx={{
      borderRadius: 5,
      border: 1.5,
      textTransform: 'none',
      borderColor: 'divider',
      '&:hover': { borderStyle: 'dashed', borderColor: 'inherit' }
    }}>
    <Stack width="100%" direction="row" alignItems="center" spacing={1}>
      {option === 'payflow' ? (
        <Avatar src="/payflow.png" sx={{ width: 36, height: 36 }} />
      ) : (
        <AccountBalanceWallet fontSize="small" sx={{ p: 0.65, width: 36, height: 36 }} />
      )}
      <Stack alignItems="flex-start">
        <Typography variant="subtitle2" fontWeight="bold" fontSize={16}>
          {option === 'payflow' ? 'Payflow' : 'External Wallet'}
        </Typography>
        <Typography variant="caption" fontWeight="bold" fontSize={12}>
          {option === 'payflow'
            ? 'Pay with your Payflow account'
            : 'Pay with your self-custody wallet'}
        </Typography>
      </Stack>
    </Stack>
  </Button>
);

export default function ChoosePaymentOptionDialog({
  setPaymentMethod,
  closeStateCallback,
  ...props
}: ChoosePaymentOptionDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      onClose={closeStateCallback}
      {...props}
      PaperProps={{
        sx: {
          borderRadius: 5,
          ...(!isMobile && {
            width: 375
          })
        }
      }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Typography variant="h6" textAlign="center">
          Select Payment Method
        </Typography>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 3,
          justifyContent: isMobile ? 'flex-end' : 'center'
        }}>
        <Stack alignItems="center" spacing={1}>
          {paymentOptionButton('payflow', setPaymentMethod)}
          {paymentOptionButton('wallet', setPaymentMethod)}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
