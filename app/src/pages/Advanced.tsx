import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { ProfileContext } from '../contexts/UserContext';
import { Box, Container, Divider, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { AddressSection } from '../components/AddressSection';

export default function Advanced() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { profile } = useContext(ProfileContext);

  return (
    profile && (
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
                  Your ethereum address linked to web3 socials (farcaster, lens, ens) for seamless
                  profile discovery and payments with your friends.
                </Typography>
                <AddressSection identity={{ address: profile.identity }} maxWidth={200} />
              </Stack>

              <Divider />

              <Stack spacing={3}>
                <Typography variant="subtitle2" fontSize={18}>
                  Flow Signers
                </Typography>
                <Typography variant="caption" fontSize={isMobile ? 12 : 14}>
                  Ethereum addresses used to sign flow related transactions
                </Typography>

                <Stack spacing={2}>
                  {profile.flows?.map((f) => (
                    <Stack spacing={1} border={1} borderRadius={5} p={2} borderColor="divider">
                      <Typography variant="subtitle2" fontSize={isMobile ? 12 : 14}>
                        <u>{f.title}</u>
                      </Typography>
                      {f.signerProvider && (
                        <AddressSection identity={{ address: profile.identity }} maxWidth={200} />
                      )}
                      <AddressSection identity={{ address: f.signer }} maxWidth={200} />
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Container>
      </>
    )
  );
}
