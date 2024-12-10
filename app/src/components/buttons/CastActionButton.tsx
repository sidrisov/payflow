import { Button, ButtonProps, Stack, Typography, Box } from '@mui/material';
import { useContext, useCallback } from 'react';
import { ProfileContext } from '../../contexts/UserContext';

import FrameV2SDK from '@farcaster/frame-sdk';

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
  const { isFrameV2 } = useContext(ProfileContext);

  const openCastInstallUrl = useCallback(async () => {
    if (installUrl) {
      FrameV2SDK.actions.close();
      FrameV2SDK.actions.openUrl(installUrl);
    }
  }, [installUrl]);

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
        justifyContent: 'flex-start'
      }}
      {...(installUrl &&
        (isFrameV2
          ? {
              onClick: openCastInstallUrl
            }
          : { href: installUrl, target: '_blank' }))}
      {...props}>
      <Stack>
        <Box display="flex" alignItems="center">
          <Typography fontSize={16} fontWeight="bold">
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
          fontWeight="normal"
          color="text.secondary"
          sx={{
            width: '100%',
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            textAlign: 'left',
            overflowWrap: 'anywhere',
            lineHeight: 1.2
          }}>
          {description}
        </Typography>
      </Stack>
    </Button>
  );
}
