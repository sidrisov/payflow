import { Typography, Stack, CircularProgress } from '@mui/material';
import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton';

export function CustomLoadingButton({
  title,
  status,
  ...props
}: { title: string; status?: string } & LoadingButtonProps) {
  return (
    <LoadingButton
      {...props}
      fullWidth
      variant="outlined"
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
            {status}
          </Typography>
        </Stack>
      }
      sx={{ my: 1, borderRadius: 5 }}>
      {title}
    </LoadingButton>
  );
}
