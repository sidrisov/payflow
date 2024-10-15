import React, { useState } from 'react';
import { Box, Typography, Chip, Avatar, Tooltip } from '@mui/material';
import { FlowType } from '../../types/FlowType';
import { ChooseFlowDialog } from '../dialogs/ChooseFlowDialog';
import { SelectedIdentityType } from '../../types/ProfileType';
import { useMobile } from '../../utils/hooks/useMobile';
import { Warning } from '@mui/icons-material';
import { red } from '@mui/material/colors';
import { PiTipJar } from 'react-icons/pi';
import FarcasterAvatar from '../avatars/FarcasterAvatar';

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
  const isMobile = useMobile();

  const getFlowIcon = (flow: FlowType) => {
    if (flow.type === 'JAR') {
      return (
        <Tooltip title="Jar">
          <PiTipJar size={20} />
        </Tooltip>
      );
    }
    if (
      !flow.type &&
      !(flow.wallets.length > 0 && flow.wallets.find((w) => w.version === '1.3.0'))
    ) {
      return (
        <Tooltip title="Payment flow created in Payflow">
          <Avatar src="/payflow.png" sx={{ width: 20, height: 20 }} />
        </Tooltip>
      );
    }
    if (flow.type === 'FARCASTER_VERIFICATION') {
      return (
        <Tooltip title="Farcaster Verification">
          <FarcasterAvatar size={20} />
        </Tooltip>
      );
    }
    if (flow.type === 'LINKED') {
      return (
        <Tooltip title="Linked Wallet">
          <Box src="/coinbase_smart_wallet.svg" component="img" sx={{ width: 20, height: 20 }} />
        </Tooltip>
      );
    }
    if (flow.wallets.length > 0 && flow.wallets.find((w) => w.version === '1.3.0')) {
      return (
        <Tooltip
          arrow
          title={
            <Typography variant="subtitle2" color={red[400]} width="300">
              Legacy flows will be decommissioned soon! <br />
              Please, move your funds to other flows.
            </Typography>
          }>
          <Warning fontSize="small" sx={{ color: red[400] }} />
        </Tooltip>
      );
    }
    return null;
  };

  return (
    <>
      <Chip
        onClick={() => setOpenSelectFlow(true)}
        icon={
          sender.identity.profile?.defaultFlow ? (
            <Box
              sx={{
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              {getFlowIcon(sender.identity.profile.defaultFlow)}
            </Box>
          ) : undefined
        }
        label={
          sender.identity.profile?.defaultFlow ? (
            <Typography variant="subtitle2" noWrap>
              {sender.identity.profile.defaultFlow.title}
            </Typography>
          ) : (
            <Typography variant="subtitle2">Pay with</Typography>
          )
        }
        variant="outlined"
        sx={{
          height: 40,
          maxWidth: 200,
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
