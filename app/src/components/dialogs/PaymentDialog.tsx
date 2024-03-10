import { Box, Dialog, DialogContent, DialogProps, useMediaQuery, useTheme } from '@mui/material';
import { Address, isAddress } from 'viem';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { FlowType } from '../../types/FlowType';
import { SelectedIdentityType } from '../../types/ProfleType';
import PayWithPayflowDialog from './PayWithPayflowDialog';
import PayWithEOADialog from './PayWithEOADialog';
import { useAccount } from 'wagmi';
import { LoadingConnectWalletButton } from '../buttons/LoadingConnectWalletButton';
import { PaymentDialogTitle } from './PaymentDialogTitle';
import { PaymentType } from '../../types/PaymentType';

export type PaymentSenderType = 'payflow' | 'wallet' | 'none';

export type PaymentDialogProps = DialogProps &
  CloseCallbackType & {
    paymentType?: PaymentSenderType;
    payment?: PaymentType;
    sender: FlowType | Address;
    recipient: SelectedIdentityType;
  } & { setOpenSearchIdentity?: React.Dispatch<React.SetStateAction<boolean>> };

export default function PaymentDialog({
  paymentType = 'payflow',
  payment,
  recipient,
  sender,
  closeStateCallback,
  setOpenSearchIdentity,
  ...props
}: PaymentDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { isConnected, address } = useAccount();

  const dialogJustifyContent =
    sender &&
    (isAddress(sender as any) ||
      (address && address.toLowerCase() === (sender as FlowType).signer.toLowerCase()))
      ? 'space-between'
      : 'flex-end';
  const isConnectWalletRequired = !(paymentType === 'wallet' ? sender : address);
  const dialogHeight = sender &&
    (isAddress(sender as any) ||
      (address && address.toLowerCase() === (sender as FlowType).signer.toLowerCase())) && {
      height: 375
    };

  console.log('Payment Dialog', isConnected, address);

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
              <LoadingConnectWalletButton
                isEmbeddedSigner={
                  paymentType === 'payflow'
                    ? (sender as FlowType).signerProvider === 'privy'
                    : false
                }
                paymentType={paymentType}
              />
            ) : paymentType === 'payflow' ? (
              <PayWithPayflowDialog
                {...{
                  paymentType,
                  payment,
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
                  payment,
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
