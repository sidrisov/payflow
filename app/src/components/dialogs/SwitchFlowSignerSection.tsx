import { Stack, Typography, Button, Avatar } from '@mui/material';
import { FlowType } from '../../types/FlowType';
import { shortenWalletAddressLabel } from '../../utils/address';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import AddressAvatar from '../avatars/AddressAvatar';
import { useEffect } from 'react';

export function SwitchFlowSignerSection({
  flow,
  onSwitch
}: {
  onSwitch?: () => void;
  flow: FlowType;
}) {
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
            setTimeout(() => {
              login({
                ...(flow.signerCredential && {
                  prefill: { type: 'email', value: flow.signerCredential },
                })
              });
            }, 100);
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
              setTimeout(() => {
                login({
                  ...(flow.signerCredential && {
                    prefill: { type: 'email', value: flow.signerCredential }
                  })
                });
              }, 100);
            }
          }
        } else {
          setTimeout(() => {
            connectWallet({ suggestedAddress: flow.signer });
          }, 100);
        }

        onSwitch?.();
      }}
      sx={{ borderRadius: 5, textTransform: 'none', height: 50, justifyContent: 'flex-start' }}>
      {flow.signerCredential ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar src="/privy.png" sx={{ width: 40, height: 40 }} />
          <Stack spacing={0.1} alignItems="flex-start">
            <Typography fontSize={15} color="text.secondary">
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
            <Typography fontSize={15} color="text.secondary">
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
