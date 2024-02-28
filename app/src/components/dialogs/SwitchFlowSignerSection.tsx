import {
  ChangeCircle,
  ChangeCircleOutlined,
  ChangeCircleRounded,
  ChangeCircleTwoTone
} from '@mui/icons-material';
import { Stack, Typography, IconButton } from '@mui/material';
import { useAccount } from 'wagmi';
import { FlowType } from '../../types/FlowType';
import { shortenWalletAddressLabel } from '../../utils/address';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';

export function SwitchFlowSignerSection({ flow }: { flow: FlowType }) {
  const { address } = useAccount();
  const { connectWallet, login, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  console.log(wallets);

  return (
    <Stack spacing={1} alignItems="center">
      <Typography variant="subtitle2">
        Please, connect following flow signer:{' '}
        <u>
          <b>{shortenWalletAddressLabel(flow.signer)}</b>
        </u>
        {'!'}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2">
          Currently connected signer:{' '}
          <u>
            <b>{shortenWalletAddressLabel(address)}</b>
          </u>
        </Typography>
        <IconButton
          size="small"
          onClick={() => {
            console.log('1');
            if (flow.signerProvider === 'privy') {
              console.log('2');

              if (!authenticated) {
                login();
              } else {
                const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
                if (embeddedWallet) {
                  setActiveWallet(embeddedWallet);
                }
              }
            } else {
              connectWallet();
            }
          }}>
          <ChangeCircleOutlined />
        </IconButton>
      </Stack>
    </Stack>
  );
}
