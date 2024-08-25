import { Stack, Typography, Button, Avatar, useMediaQuery } from '@mui/material';
import { FlowType } from '../../types/FlowType';
import { shortenWalletAddressLabel } from '../../utils/address';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { grey } from '@mui/material/colors';
import AddressAvatar from '../avatars/AddressAvatar';
import { useEffect } from 'react';

export function SwitchFlowSignerSection({ flow }: { flow: FlowType }) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const { authenticated, ready, connectWallet, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  useEffect(() => {
    if (ready && wallets.length !== 0) {
      console.log('Trying to set a wallet: ', wallets, flow.signer);
      const wallet = wallets.find((w) => w.address.toLowerCase() === flow.signer.toLowerCase());
      if (wallet) {
        console.debug('Setting active wallet: ', wallet);
        setActiveWallet(wallet);
      }
    }
  }, [flow, wallets, ready]);

  return (
    <Button
      fullWidth
      variant="outlined"
      color="inherit"
      onClick={async () => {
        if (flow.signerProvider === 'privy') {
          if (!authenticated) {
            login({
              ...(flow.signerCredential && {
                prefill: { type: 'email', value: flow.signerCredential },
                defaultPrevented: true
              })
            });
          } else {
            const embeddedWallet = wallets.find(
              (w) =>
                w.walletClientType === 'privy' &&
                w.address.toLowerCase() === flow.signer.toLowerCase()
            );
            if (!embeddedWallet) {
              // logout previously connected social wallet
              await logout();
              // login again
              login({
                ...(flow.signerCredential && {
                  prefill: { type: 'email', value: flow.signerCredential }
                })
              });
            }
          }
        } else {
          connectWallet({ suggestedAddress: flow.signer });
        }
      }}
      sx={{ borderRadius: 5, textTransform: 'none', height: 50, justifyContent: 'flex-start' }}>
      {flow.signerCredential ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar src="/privy.png" sx={{ width: 40, height: 40 }} />
          <Stack spacing={0.1} alignItems="flex-start">
            <Typography fontSize={15} color={grey[prefersDarkMode ? 400 : 700]}>
              Connect Social Signer (Privy)
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
            <Typography fontSize={15} color={grey[prefersDarkMode ? 400 : 700]}>
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
