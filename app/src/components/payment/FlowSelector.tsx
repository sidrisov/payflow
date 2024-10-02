import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { FlowType } from '../../types/FlowType';
import { ChooseFlowDialog } from '../dialogs/ChooseFlowDialog';
import { PaymentFlowSection } from '../PaymentFlowSection';
import { SelectedIdentityType } from '../../types/ProfileType';
import { useMobile } from '../../utils/hooks/useMobile';

type FlowSelectorProps = {
  sender: SelectedIdentityType;
  flows: FlowType[];
  selectedFlow: FlowType;
  setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
};

export const FlowSelector: React.FC<FlowSelectorProps> = ({
  sender,
  flows,
  selectedFlow,
  setSelectedFlow
}) => {
  const [openSelectFlow, setOpenSelectFlow] = useState(false);
  const isMobile = useMobile();

  return (
    <>
      <Box
        component={Button}
        onClick={() => setOpenSelectFlow(true)}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'flex-start',
          color: 'inherit',
          border: 1,
          borderRadius: 5,
          borderColor: 'divider',
          p: isMobile ? 1.5 : 1,
          textTransform: 'none',
          height: 56
        }}>
        {sender.identity.profile?.defaultFlow ? (
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <PaymentFlowSection flow={sender.identity.profile.defaultFlow} />
          </Box>
        ) : (
          <Typography alignSelf="center" flexGrow={1}>
            Choose Flow
          </Typography>
        )}
      </Box>

      <ChooseFlowDialog
        configurable={false}
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
