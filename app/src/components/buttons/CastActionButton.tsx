import { Button, ButtonProps, Stack, Typography, useMediaQuery } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useDarkMode } from '../../utils/hooks/useDarkMode';

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
  const prefersDarkMode = useDarkMode();

  return (
    <Button
      variant="outlined"
      size="large"
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
        <Typography fontSize={18} fontWeight="bold">
          {title} {earlyFeature && <span style={{ fontSize: 16, color: 'red' }}>(early)</span>}
        </Typography>
        <Typography
          fontSize={14}
          fontWeight="bold"
          color={grey[prefersDarkMode ? 400 : 700]}
          noWrap>
          {description}
        </Typography>
      </Stack>
    </Button>
  );
}
