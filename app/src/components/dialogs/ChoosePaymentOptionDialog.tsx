import { Avatar, Button, DialogProps, Stack, Typography } from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { AccountBalanceWallet } from '@mui/icons-material';
import { PaymentSenderType } from '../payment/PaymentDialog';
import ResponsiveDialog from './ResponsiveDialog';
import { useMobile } from '../../utils/hooks/useMobile';

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
      p: 1,
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
        <Typography variant="caption">
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
  const isMobile = useMobile();

  return (
    <ResponsiveDialog
      open={props.open}
      onOpen={() => {}}
      onClose={closeStateCallback}
      title="Select payment method"
      width={375}>
      <Stack width="100%" alignItems="center" spacing={1} p={1}>
        {paymentOptionButton('payflow', setPaymentType)}
        {paymentOptionButton('wallet', setPaymentType)}
      </Stack>
    </ResponsiveDialog>
  );
}
