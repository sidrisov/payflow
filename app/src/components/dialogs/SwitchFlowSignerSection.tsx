import { ChangeCircleOutlined } from '@mui/icons-material';
import { Stack, Typography, IconButton } from '@mui/material';
import { useAccount } from 'wagmi';
import { FlowType } from '../../types/FlowType';
import { shortenWalletAddressLabel } from '../../utils/address';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';

export function SwitchFlowSignerSection({ flow }: { flow: FlowType }) {
  const { address } = useAccount();
  const { connectWallet, login, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  console.log(wallets);

  return (
    <Stack spacing={1} alignItems="flex-start">
      <Typography variant="subtitle2">
        Please, connect signer:{' '}
        <u>
          <b>
            {flow.signerCredential ? flow.signerCredential : shortenWalletAddressLabel(flow.signer)}
          </b>
        </u>
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2">
          Connected signer:{' '}
          <u>
            <b>{shortenWalletAddressLabel(address)}</b>
          </u>
        </Typography>
        <IconButton
          size="small"
          onClick={async () => {
            if (flow.signerProvider === 'privy') {
              if (!authenticated) {
                login();
              } else {
                const embeddedWallet = wallets.find(
                  (w) => w.walletClientType === 'privy' && w.address === flow.signer
                );
                if (embeddedWallet) {
                  setActiveWallet(embeddedWallet);
                } else {
                  // logout previously connected social wallet
                  await logout();
                  // login again
                  login();
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
