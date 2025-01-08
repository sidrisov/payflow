import React from 'react';
import ResponsiveDialog from '../dialogs/ResponsiveDialog';
import { Stack, Typography } from '@mui/material';
import { SwitchFlowSignerSection } from '../dialogs/SwitchFlowSignerSection';
import { FlowType } from '@payflow/common';

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
  return (
    <ResponsiveDialog title="Connect Signer" open={open} onOpen={() => {}} onClose={onClose}>
      <Stack alignItems="flex-start" spacing={2}>
        <Typography variant="caption" color="text.secondary">
          Selected payment flow `<b>{flow.title}</b>` signer is not connected! Please, proceed with
          connecting the signer mentioned below:
        </Typography>
        <SwitchFlowSignerSection onSwitch={onClose} flow={flow} />
      </Stack>
    </ResponsiveDialog>
  );
};
