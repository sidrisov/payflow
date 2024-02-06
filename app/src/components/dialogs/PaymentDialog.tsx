import {
  Box,
  Dialog,
  DialogContent,
  DialogProps,
  DialogTitle,
  DialogTitleProps,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Address, isAddress } from 'viem';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { FlowType } from '../../types/FlowType';
import { SelectedIdentityType } from '../../types/ProfleType';
import { ArrowBack } from '@mui/icons-material';
import { shortenWalletAddressLabel } from '../../utils/address';
import AccountSendDialog from './AccountSendDialog';
import PayProfileDialog from './PayProfileDialog';
import { useAccount } from 'wagmi';
import { LoadingConnectWalletButton } from '../buttons/LoadingConnectWalletButton';

export type PaymentDialogProps = DialogProps &
  CloseCallbackType & {
    sender: FlowType | Address;
    recipient: SelectedIdentityType;
  } & { setOpenSearchIdentity?: React.Dispatch<React.SetStateAction<boolean>> };

export default function PaymentDialog({
  recipient,
  sender,
  closeStateCallback,
  ...props
}: PaymentDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { address } = useAccount();

  const dialogJustifyContent =
    sender && (isAddress(sender as any) || (address && address === (sender as FlowType).owner))
      ? 'space-between'
      : 'flex-end';
  const isConnectWalletRequired = !(sender && (isAddress(sender as any) || address));
  const dialogHeight = sender &&
    (isAddress(sender as any) || (address && address === (sender as FlowType).owner)) && {
      height: 375
    };

  return (
    recipient && (
      <Dialog
        fullScreen={isMobile}
        onClose={closeStateCallback}
        {...props}
        PaperProps={{
          sx: {
            borderRadius: 5,
            ...(!isMobile && {
              width: 375,
              ...dialogHeight
            })
          }
        }}
        sx={{
          backdropFilter: 'blur(5px)'
        }}>
        <PaymentDialogTitle sender={sender} closeStateCallback={closeStateCallback} />
        <DialogContent
          sx={{
            p: 2
          }}>
          <Box
            height="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent={dialogJustifyContent}>
            {isConnectWalletRequired ? (
              <LoadingConnectWalletButton fullWidth />
            ) : !isAddress(sender as any) ? (
              <AccountSendDialog {...{ sender, recipient, closeStateCallback, ...props }} />
            ) : (
              <PayProfileDialog {...{ sender, recipient, closeStateCallback, ...props }} />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    )
  );
}

export function PaymentDialogTitle({
  sender,
  closeStateCallback,
  ...props
}: {
  sender: FlowType | Address;
} & CloseCallbackType &
  DialogTitleProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const paymentType = sender && !isAddress(sender as any) ? 'flow' : 'wallet';
  const title = paymentType === 'flow' ? 'Send' : 'Pay';
  const mobileMargin = isMobile ? (paymentType === 'flow' ? '25vw' : '18vw') : 0;
  const from =
    paymentType === 'flow'
      ? (sender as FlowType).title
      : shortenWalletAddressLabel(sender as Address);

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
            <Typography textAlign="center" variant="caption" fontWeight="bold">
              from:{' '}
              <b>
                <u>{from}</u>
              </b>{' '}
              {paymentType}
            </Typography>
          )}
        </Stack>
      </Box>
    </DialogTitle>
  );
}
