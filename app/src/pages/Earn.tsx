import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container } from '@mui/material';

import { ProfileContext } from '../contexts/UserContext';
import { EarnTabs } from '../components/earn/EarnTabs';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import { useSearchParams } from 'react-router-dom';

export default function Earn() {
  const { isAuthenticated } = useContext(ProfileContext);
  const tab = useSearchParams()[0].get('tab') ?? undefined;

  return (
    <>
      <Helmet>
        <title> Payflow | Earn </title>
      </Helmet>
      <Container maxWidth="xs" sx={{ height: '100vh' }}>
        {isAuthenticated ? <EarnTabs tab={tab} /> : <LoadingPayflowEntryLogo />}
      </Container>
    </>
  );
}
