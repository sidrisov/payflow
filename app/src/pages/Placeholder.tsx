import { Avatar, Box, Stack, Typography, Link } from '@mui/material';
import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export default function Placeholder() {
  const [isFrameV2, setIsFrameV2] = useState(false);

  useEffect(() => {
    const initFrame = async () => {
      const context = await sdk.context;
      if (context) {
        sdk.actions.ready();
        setIsFrameV2(true);
      }
    };
    initFrame();
  }, []);

  return (
    <>
      <title>Payflow</title>
      <Box
        position="fixed"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ inset: 0, p: 3 }}>
        <Stack spacing={4} alignItems="center" justifyContent="center" maxWidth={350}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
            <Avatar
              src="/payflow.png"
              alt="Payflow Logo"
              sx={{
                width: 55,
                height: 55,
                borderRadius: 3,
                border: 1,
                borderColor: 'divider'
              }}
            />
            <Typography variant="h5" fontWeight="bold" fontFamily="monospace">
              Payflow
            </Typography>
          </Stack>

          <Stack spacing={2} alignItems="center">
            <Typography
              variant="h6"
              fontWeight="bold"
              textAlign="center"
              color="text.secondary">
              Taking a break
            </Typography>
            <Typography variant="body1" textAlign="center" color="text.secondary">
              We're rethinking how Payflow can be most useful. Stay tuned for updates.
            </Typography>
          </Stack>

          <Stack spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Follow us on{' '}
              <Link
                href="https://warpcast.com/sinaver.eth"
                target="_blank"
                rel="noopener"
                sx={{ color: 'primary.main' }}>
                Farcaster
              </Link>
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </>
  );
}
