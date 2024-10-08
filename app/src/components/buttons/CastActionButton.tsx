import { Button, ButtonProps, Stack, Typography, Box } from '@mui/material';

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
  return (
    <Button
      variant="outlined"
      size="medium"
      color="inherit"
      fullWidth
      sx={{
        textTransform: 'none',
        borderRadius: 5,
        borderColor: 'divider',
        justifyContent: 'flex-start',
        p: 1.5
      }}
      {...(installUrl && { href: installUrl, target: '_blank' })}
      {...props}>
      <Stack ml={0.1} alignItems="flex-start" width="100%">
        <Box display="flex" alignItems="center">
          <Typography fontSize={14} fontWeight="bold">
            {title}
          </Typography>
          {earlyFeature && (
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'error.main',
                display: 'inline-block',
                ml: 0.5
              }}
            />
          )}
        </Box>
        <Typography
          fontSize={12}
          fontWeight="bold"
          color="text.secondary"
          sx={{
            width: '100%',
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            textAlign: 'left',
            overflowWrap: 'break-word',
          }}>
          {description}
        </Typography>
      </Stack>
    </Button>
  );
}
