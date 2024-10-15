import React, { useState } from 'react';
import { Typography, Chip, Box, Avatar } from '@mui/material';
import { FlowType } from '../../types/FlowType';
import { ChooseFlowDialog } from '../dialogs/ChooseFlowDialog';
import { PiTipJar } from 'react-icons/pi';
import { IoIosWallet } from 'react-icons/io';

import FarcasterAvatar from '../avatars/FarcasterAvatar';
import { SelectedIdentityType } from '../../types/ProfileType';
type FlowSelectorProps = {
  variant?: 'outlined' | 'text';
  sender: SelectedIdentityType;
  flows: FlowType[];
  selectedFlow: FlowType;
  setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
};

export const FlowSelector: React.FC<FlowSelectorProps> = ({
  variant = 'outlined',
  sender,
  flows,
  selectedFlow,
  setSelectedFlow
}) => {
  const [openSelectFlow, setOpenSelectFlow] = useState(false);

  const defaultFlow = sender.identity.profile?.defaultFlow;

  const getFlowIcon = (flow?: FlowType) => {
    if (!flow) {
      return <IoIosWallet size={24} />;
    }

    switch (flow.type) {
      case 'JAR':
        return <PiTipJar size={24} />;
      case 'FARCASTER_VERIFICATION':
        return <FarcasterAvatar size={24} />;
      case 'LINKED':
        return (
          <Box src="/coinbase_smart_wallet.svg" component="img" sx={{ width: 24, height: 24 }} />
        );
      default:
        return <Avatar src="/payflow.png" sx={{ width: 24, height: 24 }} />;
    }
  };

  return (
    <>
      <Chip
        onClick={() => setOpenSelectFlow(true)}
        icon={getFlowIcon(defaultFlow)}
        label={
          <Typography variant="subtitle2" noWrap sx={{ maxWidth: 150 }}>
            {defaultFlow ? defaultFlow.title : 'Pay with flow'}
          </Typography>
        }
        variant="outlined"
        sx={{
          height: 40,
          borderRadius: 5,
          px: 0.5,
          gap: 0.5,
          '& .MuiChip-label': { px: 1 },
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'action.hover' },
          ...(variant === 'outlined' && {
            border: 1,
            borderColor: 'divider'
          })
        }}
      />

      <ChooseFlowDialog
        showOnlySigner
        open={openSelectFlow}
        onClose={() => setOpenSelectFlow(false)}
        closeStateCallback={() => setOpenSelectFlow(false)}
        flows={flows}
        selectedFlow={selectedFlow}
        setSelectedFlow={setSelectedFlow}
      />
    </>
  );
};
