import { Box, Dialog, DialogContent, DialogProps, Stack } from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { SelectedIdentityType } from '../../types/ProfileType';
import PaymentDialogContent from './PaymentDialogContent';
import { BackDialogTitle } from '../dialogs/BackDialogTitle';
import { PaymentType } from '../../types/PaymentType';
import { SenderField } from '../SenderField';
import { KeyboardDoubleArrowDown } from '@mui/icons-material';
import { RecipientField } from '../RecipientField';
import { ChooseFlowDialog } from '../dialogs/ChooseFlowDialog';
import { FlowType } from '../../types/FlowType';
import { useState } from 'react';
import React from 'react';
import { UpSlideTransition } from '../dialogs/TransitionDownUpSlide';
import { useMobile } from '../../utils/hooks/useMobile';

export type PaymentSenderType = 'payflow' | 'wallet' | 'none';

export type PaymentDialogProps = DialogProps &
  CloseCallbackType & {
    paymentType?: PaymentSenderType;
    payment?: PaymentType;
    sender: SelectedIdentityType;
    recipient: SelectedIdentityType;
    alwaysShowBackButton?: boolean;
  } & { setOpenSearchIdentity?: React.Dispatch<React.SetStateAction<boolean>> } & {
    flows?: FlowType[];
    selectedFlow?: FlowType;
    setSelectedFlow?: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  };

export default function PaymentDialog({
  alwaysShowBackButton = false,
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
  const isMobile = useMobile();
  const [openSelectFlow, setOpenSelectFlow] = useState(false);

  const recipientCompatibleFlows = flows?.filter(
    (flow) =>
      recipient.type === 'address' ||
      flow.wallets.find((senderWallet) =>
        recipient.identity.profile?.defaultFlow?.wallets.find(
          (recipientWallet) => recipientWallet.network === senderWallet.network
        )
      )
  );

  return (
    <>
      <Dialog
        disableEnforceFocus
        disableAutoFocus
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
          zIndex: 1450,
          backdropFilter: 'blur(3px)'
        }}
        {...(isMobile && { TransitionComponent: UpSlideTransition })}>
        <BackDialogTitle
          showOnDesktop={alwaysShowBackButton}
          title={props.title ?? 'New Payment'}
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

            <PaymentDialogContent
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
          </Box>
        </DialogContent>
      </Dialog>

      {recipientCompatibleFlows && selectedFlow && setSelectedFlow && (
        <ChooseFlowDialog
          showOnlySigner
          open={openSelectFlow}
          onClose={async () => setOpenSelectFlow(false)}
          closeStateCallback={async () => setOpenSelectFlow(false)}
          flows={recipientCompatibleFlows}
          selectedFlow={selectedFlow}
          setSelectedFlow={setSelectedFlow}
        />
      )}
    </>
  );
}
