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
import { BackDialogTitle } from './BackDialogTitle';
import { PaymentType } from '../../types/PaymentType';
import { SenderField } from '../SenderField';
import { KeyboardDoubleArrowDown } from '@mui/icons-material';
import { RecipientField } from '../RecipientField';
import { ChooseFlowMenu } from '../menu/ChooseFlowMenu';
import { FlowType } from '../../types/FlowType';
import { useState } from 'react';

export type PaymentSenderType = 'payflow' | 'wallet' | 'none';

export type PaymentDialogProps = DialogProps &
  CloseCallbackType & {
    paymentType?: PaymentSenderType;
    payment?: PaymentType;
    sender: SelectedIdentityType;
    recipient: SelectedIdentityType;
  } & { setOpenSearchIdentity?: React.Dispatch<React.SetStateAction<boolean>> } & {
    flows?: FlowType[];
    selectedFlow?: FlowType;
    setSelectedFlow?: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  };

export default function PaymentDialog({
  paymentType = 'payflow',
  payment,
  recipient,
  sender,
  closeStateCallback,
  setOpenSearchIdentity,
  flows,
  selectedFlow,
  setSelectedFlow,
  ...props
}: PaymentDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [openSelectFlow, setOpenSelectFlow] = useState(false);

  return (
    <>
      <Dialog
        disableEnforceFocus
        fullScreen={isMobile}
        onClose={closeStateCallback}
        {...props}
        PaperProps={{
          sx: {
            ...(!isMobile && {
              width: 425,
              borderRadius: 5,
              height: 650
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
                <SenderField sender={sender} {...(setSelectedFlow && { setOpenSelectFlow })} />
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

      {flows && selectedFlow && setSelectedFlow && (
        <ChooseFlowMenu
          open={openSelectFlow}
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'center'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left'
          }}
          closeStateCallback={async () => setOpenSelectFlow(false)}
          flows={flows}
          selectedFlow={selectedFlow}
          setSelectedFlow={setSelectedFlow}
        />
      )}
    </>
  );
}
