import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Stack } from '@mui/material';


import { ProfileContext } from '../contexts/UserContext';
import { FanTokenAuctionCard } from '../components/cards/FanTokenAuctionCard';

export default function Useful() {
  const { isAuthenticated } = useContext(ProfileContext);

  return (
    <>
      <Helmet>
        <title> Payflow | Userful </title>
      </Helmet>
      <Container maxWidth="xs" sx={{ height: '100%' }}>
        <Stack width="100%" alignItems="center">
          {isAuthenticated && <FanTokenAuctionCard />}
        </Stack>
      </Container>
    </>
  );
}
