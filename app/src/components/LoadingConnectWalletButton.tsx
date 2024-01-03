import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton';
import { useConnectModal } from '@rainbow-me/rainbowkit';

export function LoadingConnectWalletButton({
  title,
  ...props
}: LoadingButtonProps & { title?: string }) {
  const { openConnectModal, connectModalOpen } = useConnectModal();

  return (
    <LoadingButton
      {...props}
      fullWidth
      variant="outlined"
      loading={connectModalOpen}
      size="large"
      color="primary"
      onClick={() => {
        openConnectModal?.();
      }}
      sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
      {title ?? 'Connect Wallet'}
    </LoadingButton>
  );
}
