import React, { useMemo } from 'react';
import ResponsiveDialog from '../dialogs/ResponsiveDialog';
import { Stack, Typography } from '@mui/material';
import { SwitchFlowSignerSection } from '../dialogs/SwitchFlowSignerSection';
import { FlowType } from '@payflow/common';
import { shortenWalletAddressLabel2 } from '../../utils/address';

type ConnectSignerDialogProps = {
  open: boolean;
  onClose: () => void;
  flow: FlowType;
};

export const ConnectSignerDialog: React.FC<ConnectSignerDialogProps> = ({
  open,
  onClose,
  flow
}) => {
  const addressOrEmail = useMemo(() => {
    return flow.signerCredential || shortenWalletAddressLabel2(flow.signer);
  }, [flow]);

  return (
    <ResponsiveDialog
      title={
        flow.type === 'CONNECTED' || flow.type === 'FARCASTER_VERIFICATION'
          ? 'Connect Wallet'
          : 'Connect Wallet Signer'
      }
      open={open}
      onOpen={() => {}}
      onClose={onClose}>
      <Stack alignItems="center" spacing={2}>
        <Typography textAlign="center" fontSize={20} color="text.secondary">
          {addressOrEmail}
        </Typography>
        <SwitchFlowSignerSection onSwitch={onClose} flow={flow} />
      </Stack>
    </ResponsiveDialog>
  );
};
