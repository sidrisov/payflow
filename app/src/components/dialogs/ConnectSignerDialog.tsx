import React from 'react';
import ResponsiveDialog from '../dialogs/ResponsiveDialog';
import { Stack, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { SwitchFlowSignerSection } from '../dialogs/SwitchFlowSignerSection';
import { FlowType } from '../../types/FlowType';
import { useDarkMode } from '../../utils/hooks/useDarkMode';

type ConnectSignerDialogProps = {
  open: boolean;
  onClose: () => void;
  senderFlow: FlowType;
};

export const ConnectSignerDialog: React.FC<ConnectSignerDialogProps> = ({
  open,
  onClose,
  senderFlow
}) => {
  const prefersDarkMode = useDarkMode();

  return (
    <ResponsiveDialog title="Connect Signer" open={open} onOpen={() => {}} onClose={onClose}>
      <Stack alignItems="flex-start" spacing={2}>
        <Typography variant="caption" color={grey[prefersDarkMode ? 400 : 700]}>
          Selected payment flow `<b>{senderFlow.title}</b>` signer is not connected! Please, proceed
          with connecting the signer mentioned below:
        </Typography>
        <SwitchFlowSignerSection onSwitch={onClose} flow={senderFlow} />
      </Stack>
    </ResponsiveDialog>
  );
};
