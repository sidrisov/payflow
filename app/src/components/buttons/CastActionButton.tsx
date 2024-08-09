import { Button, ButtonProps, Stack, Typography, useMediaQuery } from '@mui/material';
import { grey } from '@mui/material/colors';

export default function CastActionButton({
  title,
  description,
  installUrl,
  earlyFeature = false,
  ...props
}: ButtonProps & {
  title: string;
  description?: string;
  installUrl?: string;
  earlyFeature?: boolean;
}) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  return (
    <Button
      variant="outlined"
      color="inherit"
      fullWidth
      sx={{
        textTransform: 'none',
        borderRadius: 5,
        justifyContent: 'flex-start'
      }}
      {...(installUrl && { href: installUrl, target: '_blank' })}
      {...props}>
      <Stack ml={0.5} alignItems="start">
        <Typography variant="subtitle2" fontWeight="bold">
          {title} {earlyFeature && <span style={{ color: 'red' }}>(early)</span>}
        </Typography>
        <Typography
          variant="caption"
          fontWeight="bold"
          color={grey[prefersDarkMode ? 400 : 700]}
          noWrap>
          {description}
        </Typography>
      </Stack>
    </Button>
  );
}
