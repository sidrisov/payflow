import { Stack, Typography, Button, Avatar } from '@mui/material';
import { useAccount } from 'wagmi';
import { FlowType } from '../../types/FlowType';
import { shortenWalletAddressLabel } from '../../utils/address';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { grey } from '@mui/material/colors';
import AddressAvatar from '../avatars/AddressAvatar';

export function SwitchFlowSignerSection({ flow }: { flow: FlowType }) {
  const { address } = useAccount();
  const { connectWallet, login, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  console.log(wallets);

  return (
    <Button
      fullWidth
      variant="outlined"
      color="inherit"
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
          connectWallet({ suggestedAddress: flow.signer });
        }
      }}
      sx={{ borderRadius: 5, textTransform: 'none', height: 56, justifyContent: 'flex-start' }}>
      {flow.signerCredential ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar src="/privy.png" sx={{ width: 40, height: 40 }} />
          <Stack spacing={0.1} alignItems="flex-start">
            <Typography fontSize={15} color={grey[400]}>
              Connect Social Signer
            </Typography>
            <Typography fontSize={16} fontWeight="bold">
              {flow.signerCredential}
            </Typography>
          </Stack>
        </Stack>
      ) : (
        <Stack direction="row" spacing={1} alignItems="center">
          <AddressAvatar address={flow.signer} />
          <Stack spacing={0.1} alignItems="flex-start">
            <Typography fontSize={15} color={grey[400]}>
              Connect Wallet Signer
            </Typography>
            <Typography fontSize={16} fontWeight="bold">
              {shortenWalletAddressLabel(flow.signer)}
            </Typography>
          </Stack>
        </Stack>
      )}
    </Button>
  );
}
