import { ArrowOutward, Warning } from '@mui/icons-material';
import { StackProps, Stack, Tooltip, Avatar, Box, Typography, Button } from '@mui/material';
import { red } from '@mui/material/colors';
import { PiTipJar } from 'react-icons/pi';
import { FlowType } from '@payflow/common';
import { useNavigate } from 'react-router-dom';
import FarcasterAvatar from './avatars/FarcasterAvatar';

export function PaymentFlowSection({
  navigation = false,
  flow,
  ...props
}: StackProps & { navigation?: boolean; flow: FlowType }) {
  const navigate = useNavigate();

  const isJarFlowType = flow.type === 'JAR';
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="flex-start"
      spacing={1}
      borderColor="divider"
      {...(navigation &&
        isJarFlowType && {
          component: Button,
          onClick: () => navigate(`/jar/${flow.uuid}`),
          endIcon: <ArrowOutward fontSize="small" />,
          textTransform: 'none',
          color: 'inherit',
          borderRadius: 5
        })}
      {...props}>
      {isJarFlowType && (
        <Tooltip title="Jar">
          <PiTipJar size={20} />
        </Tooltip>
      )}

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

      {flow.type === 'BANKR' && (
        <Tooltip title="Bankr Wallet">
          <Avatar variant="rounded" src="/dapps/bankr.png" sx={{ width: 20, height: 20 }} />
        </Tooltip>
      )}

      {flow.type === 'RODEO' && (
        <Tooltip title="Rodeo Wallet">
          <Avatar variant="rounded" src="/dapps/rodeo.png" sx={{ width: 20, height: 20 }} />
        </Tooltip>
      )}

      {flow.type === 'LINKED' && (
        <Tooltip title="Linked Wallet">
          <Avatar
            variant="rounded"
            src="/coinbase_smart_wallet.svg"
            sx={{ width: 20, height: 20 }}
          />
        </Tooltip>
      )}

      {flow.wallets.length > 0 && flow.wallets.find((w) => w.version === '1.3.0') && (
        <Tooltip
          arrow
          title={
            <Typography variant="subtitle2" color={red[400]} width="300">
              Legacy flows will be decomissioned soon! <br />
              Please, move your funds to other flows.
            </Typography>
          }>
          <Warning fontSize="small" sx={{ color: red[400] }} />
        </Tooltip>
      )}
      <Typography variant="subtitle2" noWrap maxWidth={isJarFlowType && navigation ? 155 : 165}>
        {flow.title}
      </Typography>
    </Stack>
  );
}
