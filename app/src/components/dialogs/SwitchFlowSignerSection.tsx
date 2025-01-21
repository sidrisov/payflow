import { Button } from '@mui/material';
import { FlowType } from '@payflow/common';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
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
      size="large"
      onClick={async () => {
        if (flow.signerProvider === 'privy') {
          if (!authenticated) {
            setTimeout(() => {
              login({
                ...(flow.signerCredential && {
                  prefill: { type: 'email', value: flow.signerCredential }
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
      sx={{ borderRadius: 5 }}>
      Connect
    </Button>
  );
}
