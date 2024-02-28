import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton';
import { PaymentType } from '../dialogs/PaymentDialog';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';

export function LoadingConnectWalletButton({
  paymentType = 'payflow',
  isEmbeddedSigner = false,
  title,
  ...props
}: LoadingButtonProps & { paymentType?: PaymentType; isEmbeddedSigner?: boolean; title?: string }) {
  const { connectWallet, login, isModalOpen } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  console.log(wallets);

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
          console.log('1');
          const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');

          if (embeddedWallet) {
            console.log('2');

            setActiveWallet(embeddedWallet);
          } else {
            console.log('3');

            login();
          }
        } else {
          console.log('4');

          connectWallet();
        }
      }}
      sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
      {title ?? 'Connect Wallet'}
    </LoadingButton>
  );
}
