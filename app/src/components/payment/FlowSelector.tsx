import React, { useState } from 'react';
import { Typography, Chip, Box, Avatar } from '@mui/material';
import { FlowType } from '@payflow/common';
import { ChooseFlowDialog } from '../dialogs/ChooseFlowDialog';
import { IoIosArrowDown, IoIosWallet } from 'react-icons/io';

import FarcasterAvatar from '../avatars/FarcasterAvatar';
type FlowSelectorProps = {
  variant?: 'outlined' | 'text';
  disabled?: boolean;
  flows: FlowType[];
  selectedFlow: FlowType;
  setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType>>;
};

export const FlowSelector: React.FC<FlowSelectorProps> = ({
  disabled = false,
  variant = 'outlined',
  flows,
  selectedFlow,
  setSelectedFlow
}) => {
  const [openSelectFlow, setOpenSelectFlow] = useState(false);

  const getFlowIcon = (flow?: FlowType) => {
    if (!flow) {
      return <IoIosWallet size={24} />;
    }

    switch (flow.type) {
      case 'CONNECTED':
        return flow.icon ? (
          <Avatar src={flow.icon} sx={{ width: 24, height: 24 }} />
        ) : (
          <IoIosWallet size={24} />
        );
      case 'FARCASTER_VERIFICATION':
        return <FarcasterAvatar size={24} />;
      default:
        return <Avatar src="/payflow.png" sx={{ width: 24, height: 24 }} />;
    }
  };

  return (
    <>
      <Chip
        onClick={() => setOpenSelectFlow(true)}
        icon={getFlowIcon(selectedFlow)}
        disabled={disabled}
        label={
          <Typography variant="subtitle2" noWrap sx={{ maxWidth: 150 }}>
            {selectedFlow ? selectedFlow.title : 'Pay with flow'}
          </Typography>
        }
        variant="outlined"
        deleteIcon={<IoIosArrowDown />}
        onDelete={() => setOpenSelectFlow(true)}
        sx={{
          p: 0.5,
          gap: 0.5,
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'action.hover' },
          ...(variant === 'outlined' && {
            border: 1,
            borderColor: 'divider'
          })
        }}
      />

      {flows && (
        <ChooseFlowDialog
          paymentView
          open={openSelectFlow}
          onClose={() => setOpenSelectFlow(false)}
          closeStateCallback={() => setOpenSelectFlow(false)}
          flows={flows}
          selectedFlow={selectedFlow}
          setSelectedFlow={setSelectedFlow}
        />
      )}
    </>
  );
};
