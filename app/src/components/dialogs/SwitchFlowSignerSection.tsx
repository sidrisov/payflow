import { ChangeCircle } from '@mui/icons-material';
import { Stack, Typography, IconButton } from '@mui/material';
import { useAccount } from 'wagmi';
import { FlowType } from '../../types/FlowType';
import { shortenWalletAddressLabel } from '../../utils/address';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { WALLET_PROVIDER } from '../../utils/providers';
import { useSetActiveWallet } from '@privy-io/wagmi';

export function SwitchFlowSignerSection({ flow }: { flow: FlowType }) {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { connectWallet, login, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

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
            if (WALLET_PROVIDER === 'privy') {
              if (flow.signerProvider === 'privy') {
                if (!authenticated) {
                  login();
                } else {
                  setActiveWallet(
                    wallets.find((w) => w.walletClientType === 'privy') ?? wallets[0]
                  );
                }
              } else {
                connectWallet();
              }
            } else {
              openConnectModal?.();
            }
          }}>
          <ChangeCircle />
        </IconButton>
      </Stack>
    </Stack>
  );
}
