import {
  Box,
  Dialog,
  DialogContent,
  DialogProps,
  Stack,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { SelectedIdentityType } from '../../types/ProfleType';
import PayWithPayflowDialog from './PayWithPayflowDialog';
import PayWithEOADialog from './PayWithEOADialog';
import { useAccount } from 'wagmi';
import { BackDialogTitle } from './BackDialogTitle';
import { PaymentType } from '../../types/PaymentType';
import { SenderField } from '../SenderField';
import { KeyboardDoubleArrowDown } from '@mui/icons-material';
import { RecipientField } from '../RecipientField';

export type PaymentSenderType = 'payflow' | 'wallet' | 'none';

export type PaymentDialogProps = DialogProps &
  CloseCallbackType & {
    paymentType?: PaymentSenderType;
    payment?: PaymentType;
    sender: SelectedIdentityType;
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

  const { address } = useAccount();

  const isConnectWalletRequired = !(paymentType === 'wallet' ? sender : address);

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
              height: 600
            })
          }
        }}
        sx={{
          backdropFilter: 'blur(5px)'
        }}>
        <BackDialogTitle title="Pay" closeStateCallback={closeStateCallback} />
        <DialogContent
          sx={{
            p: 2
          }}>
          <Box
            height="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="space-between">
            {sender && (
              <Stack spacing={1} alignItems="center" width="100%">
                <SenderField sender={sender} />
                <KeyboardDoubleArrowDown />
                <RecipientField
                  recipient={recipient}
                  setOpenSearchIdentity={setOpenSearchIdentity}
                />
              </Stack>
            )}

            {paymentType === 'payflow' ? (
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
