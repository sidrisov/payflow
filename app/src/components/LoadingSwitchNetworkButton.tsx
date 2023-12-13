import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton';
import { useEffect } from 'react';
import { useSwitchNetwork } from 'wagmi';

export function LoadingSwitchNetworkButton({
  chainId,
  ...props
}: { chainId: number } & LoadingButtonProps) {
  const { switchNetwork, isLoading } = useSwitchNetwork();

  useEffect(() => {
    switchNetwork?.(chainId);
  }, [chainId]);

  return (
    <LoadingButton
      {...props}
      fullWidth
      variant="outlined"
      loading={isLoading}
      size="large"
      color="primary"
      onClick={() => {
        switchNetwork?.(chainId);
      }}
      sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
      Switch Network
    </LoadingButton>
  );
}
