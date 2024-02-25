import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useContext } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { PaymentType } from '../dialogs/PaymentDialog';

export function LoadingConnectWalletButton({
  paymentType = 'payflow',
  title,
  ...props
}: LoadingButtonProps & { paymentType?: PaymentType; title?: string }) {
  const { walletProvider } = useContext(ProfileContext);
  const { openConnectModal, connectModalOpen } = useConnectModal();

  /*
  const { isModalOpen } = usePrivy();

   const { setActiveWallet } = useSetActiveWallet();
  const { wallets } = useWallets();

     const { login } = useLogin({
    onComplete: () => {
      //setActiveWallet(wallets.find((w) => w.walletClientType === 'privy') ?? wallets[0]);
    }
  });

  const { connectWallet } = useConnectWallet({
    onSuccess(wallet) {
      if (wallet) {
        //setActiveWallet(wallet as ConnectedWallet);
      }
    }
  }); */

  return (
    <LoadingButton
      {...props}
      fullWidth
      variant="outlined"
      loading={connectModalOpen}
      size="large"
      color="inherit"
      onClick={async () => {
        openConnectModal?.();
      }}
      sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
      {title ?? 'Connect Wallet'}
    </LoadingButton>
  );
}
