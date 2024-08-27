import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Stack } from '@mui/material';

import { ProfileContext } from '../contexts/UserContext';
import { DegenInfoCard } from '../components/cards/DegenInfoCard';
import { MoxieInfoCard } from '../components/cards/MoxieInfoCard';

export default function Useful() {
  const { isAuthenticated } = useContext(ProfileContext);

  return (
    <>
      <Helmet>
        <title> Payflow | Userful </title>
      </Helmet>
      <Container maxWidth="xs">
        {isAuthenticated && (
          <Stack alignItems="center" spacing={3}>
            <MoxieInfoCard />
            <DegenInfoCard />
          </Stack>
        )}
      </Container>
    </>
  );
}
