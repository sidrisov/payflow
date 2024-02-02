import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton';
import { useMemo } from 'react';
import { useSwitchChain } from 'wagmi';

export function LoadingSwitchNetworkButton({
  chainId,
  ...props
}: { chainId: number } & LoadingButtonProps) {
  const { switchChainAsync, isPending, isError } = useSwitchChain();

  useMemo(async () => {
    if (!isPending) {
      await switchChainAsync?.({ chainId });
    }
  }, [chainId, isPending]);

  return (
    <LoadingButton
      {...props}
      fullWidth
      variant="outlined"
      loading={isPending && !isError}
      size="large"
      color="inherit"
      onClick={async () => {
        if (isError || !isPending) {
          await switchChainAsync?.({ chainId });
        }
      }}
      sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
      Switch Network
    </LoadingButton>
  );
}
