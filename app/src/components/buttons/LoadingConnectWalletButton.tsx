import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton';
import { PaymentSenderType } from '../dialogs/PaymentDialog';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';

export function LoadingConnectWalletButton({
  paymentType = 'payflow',
  isEmbeddedSigner = false,
  title,
  ...props
}: LoadingButtonProps & {
  paymentType?: PaymentSenderType;
  isEmbeddedSigner?: boolean;
  title?: string;
}) {
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
          const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
          if (embeddedWallet) {
            setActiveWallet(embeddedWallet);
          } else {
            login();
          }
        } else {
          connectWallet();
        }
      }}
      sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
      {title ?? 'Connect Wallet'}
    </LoadingButton>
  );
}
