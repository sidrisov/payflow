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
import { PaymentSenderType } from './PaymentDialog';

export type ChoosePaymentOptionDialogProps = DialogProps &
  CloseCallbackType & {
    setPaymentType: React.Dispatch<React.SetStateAction<PaymentSenderType>>;
  } & { setOpenSearchIdentity?: React.Dispatch<React.SetStateAction<boolean>> };

const paymentOptionButton = (
  option: PaymentSenderType,
  setPaymentType: React.Dispatch<React.SetStateAction<PaymentSenderType>>
) => (
  <Button
    fullWidth
    variant="outlined"
    size="small"
    color="inherit"
    onClick={() => {
      setPaymentType(option);
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
  setPaymentType,
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
      <DialogTitle variant="h6" textAlign="center">
        Select payment method
      </DialogTitle>
      <DialogContent
        sx={{
          p: 3,
          justifyContent: isMobile ? 'flex-end' : 'center'
        }}>
        <Stack alignItems="center" spacing={1}>
          {paymentOptionButton('payflow', setPaymentType)}
          {paymentOptionButton('wallet', setPaymentType)}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
