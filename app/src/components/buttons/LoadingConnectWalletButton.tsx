import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { PaymentType } from '../dialogs/PaymentDialog';
import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { WALLET_PROVIDER } from '../../utils/providers';
import { useSetActiveWallet } from '@privy-io/wagmi';

export function LoadingConnectWalletButton({
  paymentType = 'payflow',
  isEmbeddedSigner = false,
  title,
  ...props
}: LoadingButtonProps & { paymentType?: PaymentType; isEmbeddedSigner?: boolean; title?: string }) {
  const { openConnectModal, connectModalOpen } = useConnectModal();

  const { address } = useAccount();
  const { connectWallet, login, authenticated, isModalOpen } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  const isLoading = WALLET_PROVIDER === 'rainbowkit' ? connectModalOpen : isModalOpen;
  console.log(WALLET_PROVIDER, openConnectModal);

  return (
    <LoadingButton
      {...props}
      fullWidth
      variant="outlined"
      loading={isLoading}
      size="large"
      color="inherit"
      onClick={async () => {
        if (WALLET_PROVIDER === 'privy') {
          if (isEmbeddedSigner) {
            const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');

            if (embeddedWallet) {
              setActiveWallet(embeddedWallet);
            } else {
              login();
            }
          } else {
            connectWallet();
          }
        } else {
          openConnectModal?.();
        }
      }}
      sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
      {title ?? 'Connect Wallet'}
    </LoadingButton>
  );
}
