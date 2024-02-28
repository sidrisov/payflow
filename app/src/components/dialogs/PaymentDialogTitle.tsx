import {
  Box,
  DialogTitle,
  DialogTitleProps,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Address } from 'viem';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { FlowType } from '../../types/FlowType';
import { ArrowBack, ChangeCircleOutlined } from '@mui/icons-material';
import { shortenWalletAddressLabel } from '../../utils/address';
import { useConnectWallet } from '@privy-io/react-auth';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { WALLET_PROVIDER } from '../../utils/providers';

export function PaymentDialogTitle({
  paymentType,
  sender,
  closeStateCallback,
  ...props
}: {
  paymentType: 'payflow' | 'wallet' | 'none';
  sender: FlowType | Address;
} & CloseCallbackType &
  DialogTitleProps) {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const title = paymentType === 'payflow' ? 'Send' : 'Pay';
  const mobileMargin = isMobile ? (paymentType === 'payflow' ? '25vw' : '18vw') : 0;
  const from =
    paymentType === 'payflow'
      ? (sender as FlowType).title
      : shortenWalletAddressLabel(sender as Address);

  const { connectWallet } = useConnectWallet();
  const { openConnectModal } = useConnectModal();

  return (
    <DialogTitle {...props}>
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent={isMobile ? 'flex-start' : 'center'}>
        {isMobile && (
          <IconButton onClick={closeStateCallback}>
            <ArrowBack />
          </IconButton>
        )}
        <Stack ml={mobileMargin} alignItems="center">
          <Typography variant="h6">{title}</Typography>
          {sender && (
            <Stack spacing={1} direction="row" alignItems="center">
              <Typography textAlign="center" variant="subtitle2" fontWeight="bold">
                from:{' '}
                <b>
                  <u>{from}</u>
                </b>{' '}
              </Typography>
              {paymentType === 'wallet' && (
                <IconButton
                  size="small"
                  onClick={async () => {
                    if (WALLET_PROVIDER === 'privy') {
                      connectWallet();
                    } else {
                      openConnectModal?.();
                    }
                  }}>
                  <ChangeCircleOutlined fontSize="small" />
                </IconButton>
              )}
            </Stack>
          )}
        </Stack>
      </Box>
    </DialogTitle>
  );
}
