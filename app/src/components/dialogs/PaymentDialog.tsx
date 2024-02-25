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
import { ArrowBack, Logout } from '@mui/icons-material';
import { shortenWalletAddressLabel } from '../../utils/address';
import PayWithPayflowDialog from './PayWithPayflowDialog';
import PayWithEOADialog from './PayWithEOADialog';
import { useAccount, useDisconnect, useReconnect } from 'wagmi';
import { LoadingConnectWalletButton } from '../buttons/LoadingConnectWalletButton';
import { useEffect } from 'react';
import { red } from '@mui/material/colors';

export type PaymentType = 'payflow' | 'wallet' | 'none';

export type PaymentDialogProps = DialogProps &
  CloseCallbackType & {
    paymentType?: PaymentType;
    sender: FlowType | Address;
    recipient: SelectedIdentityType;
  } & { setOpenSearchIdentity?: React.Dispatch<React.SetStateAction<boolean>> };

export default function PaymentDialog({
  paymentType = 'payflow',
  recipient,
  sender,
  closeStateCallback,
  setOpenSearchIdentity,
  ...props
}: PaymentDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { address } = useAccount();

  const { reconnect } = useReconnect();

  // added re-connect specifically for privy
  useEffect(() => {
    reconnect();
  }, []);

  const dialogJustifyContent =
    sender &&
    (isAddress(sender as any) ||
      (address && address.toLowerCase() === (sender as FlowType).owner.toLowerCase()))
      ? 'space-between'
      : 'flex-end';
  const isConnectWalletRequired = !(sender && (isAddress(sender as any) || address));
  const dialogHeight = sender &&
    (isAddress(sender as any) ||
      (address && address.toLowerCase() === (sender as FlowType).owner.toLowerCase())) && {
      height: 375
    };

  return (
    recipient && (
      <Dialog
        disableEnforceFocus
        fullScreen={isMobile}
        onClose={closeStateCallback}
        {...props}
        PaperProps={{
          sx: {
            ...(!isMobile && {
              width: 375,
              borderRadius: 5,
              ...dialogHeight
            })
          }
        }}
        sx={{
          backdropFilter: 'blur(5px)'
        }}>
        <PaymentDialogTitle
          paymentType={paymentType}
          sender={sender}
          closeStateCallback={closeStateCallback}
        />

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
              <LoadingConnectWalletButton paymentType={paymentType} />
            ) : paymentType === 'payflow' ? (
              <PayWithPayflowDialog
                {...{
                  paymentType,
                  sender,
                  recipient,
                  closeStateCallback,
                  setOpenSearchIdentity,
                  ...props
                }}
              />
            ) : (
              <PayWithEOADialog
                {...{
                  paymentType,
                  sender,
                  recipient,
                  closeStateCallback,
                  setOpenSearchIdentity,
                  ...props
                }}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    )
  );
}

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

  const { disconnect } = useDisconnect();

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
                    disconnect();
                  }}
                  sx={{ color: red.A700 }}>
                  <Logout fontSize="small" />
                </IconButton>
              )}
            </Stack>
          )}
        </Stack>
      </Box>
    </DialogTitle>
  );
}

/* <Tooltip title="Add a note">
                <IconButton
                  size="small"
                  color="inherit"
                  sx={{ mr: 0.5, alignSelf: 'flex-end' }}
                  onClick={() => {
                    comingSoonToast();
                  }}>
                  <AddComment fontSize="small" />
                </IconButton>
              </Tooltip> */
