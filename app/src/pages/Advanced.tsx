import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { ProfileContext } from '../contexts/UserContext';
import { Box, Container, Divider, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';

export default function Advanced() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { profile } = useContext(ProfileContext);

  return (
    <>
      <Helmet>
        <title> Payflow | Advanced </title>
      </Helmet>
      <Container maxWidth="xs" sx={{ height: '100%' }}>
        <Box
          height="100%"
          display="flex"
          flexDirection="column"
          justifyContent={isMobile ? 'space-between' : 'flex-start'}
          sx={{ p: 3 }}>
          <Stack mb={3} spacing={3}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" fontSize={18}>
                Identity
              </Typography>
              <Typography variant="caption" fontSize={isMobile ? 12 : 14}>
                Your ethereum address linked to web3 socials (ens, farcaster, lens) for seamless
                profile discovery and payments with your friends.
              </Typography>
              <Typography variant="subtitle2" fontSize={isMobile ? 12 : 14}>
                {profile.identity}
              </Typography>
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2" fontSize={18}>
                Flow Signer
              </Typography>
              <Typography variant="caption" fontSize={isMobile ? 12 : 14}>
                Your ethereum address used to sign all flow related transactions, reducing the need
                for additional identity wallet signatures.
              </Typography>
              <Typography variant="subtitle2" fontSize={isMobile ? 12 : 14}>
                {profile.signer ?? profile.identity}
              </Typography>
            </Stack>
          </Stack>

          {/* <LoadingButton
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => comingSoonToast()}
            sx={{ borderRadius: 5 }}>
            Save
          </LoadingButton> */}
        </Box>
      </Container>
    </>
  );
}
