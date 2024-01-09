import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton';
import { useMemo } from 'react';
import { useSwitchNetwork } from 'wagmi';

export function LoadingSwitchNetworkButton({
  chainId,
  ...props
}: { chainId: number } & LoadingButtonProps) {
  const { switchNetworkAsync, isLoading, pendingChainId, isError } = useSwitchNetwork();

  useMemo(async () => {
    if (chainId !== pendingChainId) {
      await switchNetworkAsync?.(chainId);
    }
  }, [chainId, pendingChainId]);

  return (
    <LoadingButton
      {...props}
      fullWidth
      variant="outlined"
      loading={isLoading && !isError}
      size="large"
      color="inherit"
      onClick={async () => {
        if (isError || chainId !== pendingChainId) {
          await switchNetworkAsync?.(chainId);
        }
      }}
      sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
      Switch Network
    </LoadingButton>
  );
}
