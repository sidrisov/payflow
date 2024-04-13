import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { ProfileContext } from '../contexts/UserContext';
import {
  Avatar,
  Box,
  Button,
  Container,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';

export default function Tools() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { profile } = useContext(ProfileContext);

  return (
    profile && (
      <>
        <Helmet>
          <title> Payflow | Tools </title>
        </Helmet>
        <Container maxWidth="xs" sx={{ height: '100%' }}>
          <Box
            height="100%"
            display="flex"
            flexDirection="column"
            justifyContent={isMobile ? 'space-between' : 'flex-start'}
            sx={{ p: 3 }}>
            <Stack
              p={3}
              spacing={3}
              alignItems="center"
              border={1.5}
              borderRadius={5}
              borderColor="divider">
              <Avatar src="/farcaster.svg" variant="rounded" />
              <Typography variant="h6">Farcaster Actions</Typography>
              <Stack spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  sx={{ borderRadius: 5 }}
                  href="https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fapi.alpha.payflow.me%2Fapi%2Ffarcaster%2Factions%2Finvite"
                  target="_blank">
                  Install Invite Action
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  sx={{ borderRadius: 5 }}
                  href="https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fapi.alpha.payflow.me%2Fapi%2Ffarcaster%2Factions%2Fpay%2Fintent%3Famount%3D0.99%26token%3Ddegen%26chain%3Ddegen"
                  target="_blank">
                  Create Payment Action
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Container>
      </>
    )
  );
}
