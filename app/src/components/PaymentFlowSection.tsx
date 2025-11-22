import { ArrowOutward } from '@mui/icons-material';
import { StackProps, Stack, Tooltip, Avatar, Box, Typography, Button } from '@mui/material';
import { FlowType } from '@payflow/common';
import { useNavigate } from 'react-router';
import FarcasterAvatar from './avatars/FarcasterAvatar';
import { IoWallet } from 'react-icons/io5';

export function PaymentFlowSection({
  navigation = false,
  flow,
  ...props
}: StackProps & { navigation?: boolean; flow: FlowType }) {
  const navigate = useNavigate();

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="flex-start"
      spacing={1}
      borderColor="divider"
      {...props}>

      {!flow.type &&
        !(flow.wallets.length > 0 && flow.wallets.find((w) => w.version === '1.3.0')) && (
          <Tooltip title="Payment flow created in Payflow">
            <Avatar variant="rounded" src="/payflow.png" sx={{ width: 20, height: 20 }} />
          </Tooltip>
        )}

      {flow.type === 'FARCASTER_VERIFICATION' && (
        <Tooltip title="Farcaster Verification">
          <FarcasterAvatar variant="rounded" size={20} />
        </Tooltip>
      )}

      {flow.type === 'CONNECTED' && (
        <Tooltip title="Connected Wallet">
          {flow.icon ? (
            <Avatar variant="rounded" src={flow.icon} sx={{ width: 20, height: 20 }} />
          ) : (
            <IoWallet size={20} />
          )}
        </Tooltip>
      )}

      <Typography variant="subtitle2" noWrap maxWidth={navigation ? 155 : 165}>
        {flow.title}
      </Typography>
    </Stack>
  );
}
