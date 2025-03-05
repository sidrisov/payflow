import LoadingButton, { ButtonProps } from '@mui/lab/LoadingButton';
import { CircularProgress, Stack, Typography } from '@mui/material';
import { useSwitchChain } from 'wagmi';

export function LoadingSwitchChainButton({
  chainId,
  onSuccess,
  lazy = true,
  ...props
}: { chainId: number; onSuccess?: () => void; lazy?: boolean } & ButtonProps) {
  const { switchChainAsync, isPending, isError, chains } = useSwitchChain({
    mutation: { onSuccess }
  });

  const chainName = chains.find((c) => c.id === chainId)?.name;

  /* useEffect(() => {
    if (lazy) {
      return;
    }
    try {
      switchChainAsync({ chainId });
    } catch (error) {
      console.error('Error', error);
    }
  }, [lazy, chainId, switchChainAsync]); */

  console.log(`Switch chain: isPending=${isPending}' isError=${isError}`);

  return (
    <LoadingButton
      {...props}
      fullWidth
      variant="contained"
      loading={isPending && !isError}
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
      sx={{ my: 1 }}>
      Switch to {chainName}
    </LoadingButton>
  );
}
