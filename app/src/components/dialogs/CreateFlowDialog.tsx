import { Box, MenuItem, MenuList, Stack, Typography } from '@mui/material';
import ResponsiveDialog, { ResponsiveDialogProps } from './ResponsiveDialog';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { AutoMode, Link } from '@mui/icons-material';
import { TbHandClick } from 'react-icons/tb';
import PayflowBalanceDialog from './PayflowBalanceDialog';
import { useState } from 'react';
import { ProfileType } from '../../types/ProfileType';
import { comingSoonToast } from '../Toasts';

type FlowTypeOption = {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: 'balance' | 'auto' | 'linked';
};

const flowTypes: FlowTypeOption[] = [
  {
    title: 'Payflow Balance',
    description: '1-click gasless payments',
    icon: <TbHandClick size={24} />,
    value: 'balance'
  },
  {
    title: 'Payflow Auto (Coming Soon)',
    description: 'Automated payments in feed or app',
    icon: <AutoMode />,
    value: 'auto'
  },
  {
    title: 'Linked Wallet (Coming Soon)',
    description: 'Connect an existing wallet',
    icon: <Link />,
    value: 'linked'
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
      <ResponsiveDialog title="Create Payment Flow" {...props} onClose={closeStateCallback}>
        <MenuList sx={{ width: '100%' }}>
          {flowTypes.map((type) => (
            <MenuItem
              key={type.value}
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
                {type.icon}
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
            All accounts are non-custodial, except for scoped spending permissions in automations
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
