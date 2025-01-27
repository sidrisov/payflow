import { Typography, Stack, CircularProgress } from '@mui/material';
import LoadingButton, { ButtonProps } from '@mui/lab/LoadingButton';

export function CustomLoadingButton({
  title,
  status,
  ...props
}: { title: string; status?: string; borderRadius?: number } & ButtonProps) {
  return (
    <LoadingButton
      fullWidth
      variant="outlined"
      size="medium"
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
      sx={{ my: 1, ...props.sx }}>
      {title}
    </LoadingButton>
  );
}
