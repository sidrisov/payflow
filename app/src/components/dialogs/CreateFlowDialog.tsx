import { Box, MenuItem, MenuList, Stack, Typography } from '@mui/material';
import ResponsiveDialog, { ResponsiveDialogProps } from './ResponsiveDialog';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { Link } from '@mui/icons-material';
import { TbHandClick } from 'react-icons/tb';
import PayflowBalanceDialog from './PayflowBalanceDialog';
import { useState } from 'react';
import { ProfileType } from '@payflow/common';
import { comingSoonToast } from '../Toasts';

type FlowTypeOption = {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: 'balance' | 'auto' | 'linked';
  disabled?: boolean;
};

const flowTypes: FlowTypeOption[] = [
  {
    title: 'Payflow Wallet v2',
    description: '1-click gasless and automated payments with session keys',
    icon: <TbHandClick size={24} />,
    value: 'balance'
  },
  {
    title: 'Linked Wallet (Coming Soon)',
    description: 'Connect an existing wallet',
    icon: <Link />,
    value: 'linked',
    disabled: true
  }
];

export type CreateFlowDialogProps = ResponsiveDialogProps &
  CloseCallbackType & {
    profile: ProfileType;
  };

export function CreateFlowDialog({ closeStateCallback, profile, ...props }: CreateFlowDialogProps) {
  const [showCreatePayflowBalance, setCreateShowPayflowBalance] = useState(false);

  return (
    <>
      <ResponsiveDialog title="New Payment Wallet" {...props} onClose={closeStateCallback}>
        <MenuList sx={{ width: '100%' }}>
          {flowTypes.map((type) => (
            <MenuItem
              key={type.value}
              disabled={type.disabled}
              onClick={() => {
                if (type.value === 'balance') {
                  setCreateShowPayflowBalance(true);
                } else {
                  comingSoonToast();
                }
                closeStateCallback();
              }}
              sx={{
                borderRadius: 5,
                py: 2
              }}>
              <Stack direction="row" spacing={2} alignItems="center" width="100%">
                <Box sx={{ flexShrink: 0 }}>{type.icon}</Box>
                <Typography variant="subtitle1">
                  {type.title}
                  <Typography
                    display="block"
                    variant="body2"
                    color="text.secondary"
                    sx={{ textWrap: 'pretty' }}>
                    {type.description}
                  </Typography>
                </Typography>
              </Stack>
            </MenuItem>
          ))}
        </MenuList>

        <Box
          sx={{
            borderRadius: 5,
            border: 1,
            borderColor: 'divider',
            p: 1
          }}>
          <Typography
            textAlign="center"
            fontSize={12}
            color="textSecondary"
            sx={{ textWrap: 'pretty' }}>
            All accounts are non-custodial, except for scoped permissions in Payflow Wallet
          </Typography>
        </Box>
      </ResponsiveDialog>

      {showCreatePayflowBalance && (
        <PayflowBalanceDialog
          open={true}
          profile={profile}
          closeStateCallback={() => setCreateShowPayflowBalance(false)}
        />
      )}
    </>
  );
}
