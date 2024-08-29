import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton';
import { CircularProgress, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useSwitchChain } from 'wagmi';

export function LoadingSwitchChainButton({
  chainId,
  ...props
}: { chainId: number } & LoadingButtonProps) {
  const { switchChainAsync, isPending, isError, chains } = useSwitchChain();

  const chainName = chains.find((c) => c.id === chainId)?.name;
  useMemo(async () => {
    await switchChainAsync({ chainId });
  }, [chainId, switchChainAsync]);

  console.log(`Switch chain: isPending=${isPending}' isError=${isError}`);

  return (
    <LoadingButton
      {...props}
      fullWidth
      variant="outlined"
      loading={isPending && !isError}
      size="large"
      color="inherit"
      loadingIndicator={
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress color="inherit" size={16} />
          <Typography
            noWrap
            variant="button"
            textOverflow="ellipsis"
            overflow="hidden"
            whiteSpace="nowrap"
            sx={{ maxWidth: 200 }}>
            Switching to {chainName}
          </Typography>
        </Stack>
      }
      onClick={async () => {
        if (isError || !isPending) {
          await switchChainAsync?.({ chainId });
        }
      }}
      sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
      Switch to {chainName}
    </LoadingButton>
  );
}
