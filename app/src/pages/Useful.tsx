import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Stack } from '@mui/material';

import { ProfileContext } from '../contexts/UserContext';
import { FanTokenAuctionCard } from '../components/cards/FanTokenAuctionCard';
import { AvailableMoxieRewardsCard } from '../components/cards/AvailableMoxieRewardsCard';

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
            <AvailableMoxieRewardsCard />
            <FanTokenAuctionCard />
          </Stack>
        )}
      </Container>
    </>
  );
}
