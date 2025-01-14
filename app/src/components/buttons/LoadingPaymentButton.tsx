import { Typography, Stack, CircularProgress } from '@mui/material';
import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton';

export function CustomLoadingButton({
  title,
  status,
  borderRadius = 5,
  ...props
}: { title: string; status?: string; borderRadius?: number } & LoadingButtonProps) {
  return (
    <LoadingButton
      fullWidth
      variant="outlined"
      size="large"
      color="inherit"
      {...props}
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
            {status}
          </Typography>
        </Stack>
      }
      sx={{ my: 1, borderRadius }}>
      {title}
    </LoadingButton>
  );
}
