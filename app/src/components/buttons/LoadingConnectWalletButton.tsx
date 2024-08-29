import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton';
import { PaymentSenderType } from '../dialogs/PaymentDialog';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { useEffect } from 'react';
import { degen } from 'viem/chains';

export function LoadingConnectWalletButton({
  isEmbeddedSigner = false,
  address,
  title,
  ...props
}: LoadingButtonProps & {
  address?: string;
  isEmbeddedSigner?: boolean;
  title?: string;
}) {
  const { ready, connectWallet, login, isModalOpen, user } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  useEffect(() => {
    if (ready && wallets.length !== 0) {
      console.log('Trying to set a wallet: ', wallets, user);
      // filter out embedded wallets
      const wallet = wallets.find((w) =>
        isEmbeddedSigner ? w.walletClientType === 'privy' : w.walletClientType !== 'privy'
      );
      if (wallet) {
        console.debug('Setting active wallet: ', wallet);
        setActiveWallet(wallet);
      }
    }
  }, [isEmbeddedSigner, wallets, ready]);
  return (
    <LoadingButton
      {...props}
      fullWidth
      variant="outlined"
      loading={isModalOpen}
      size="large"
      color="inherit"
      onClick={async () => {
        if (isEmbeddedSigner) {
          const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
          if (!embeddedWallet) {
            login();
          }
        } else {
          connectWallet({ suggestedAddress: address });
        }
      }}
      sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
      {title ?? 'Connect Wallet'}
    </LoadingButton>
  );
}
