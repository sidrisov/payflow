import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container } from '@mui/material';

import { ProfileContext } from '../contexts/UserContext';
import { ServiceTabs } from '../components/payment/services/ServiceTabs';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import { useSearchParams } from 'react-router-dom';

export default function PaymentServices() {
  const { isAuthenticated } = useContext(ProfileContext);
  const tab = useSearchParams()[0].get('tab') ?? undefined;

  return (
    <>
      <Helmet>
        <title> Payflow | Payment Services </title>
      </Helmet>
      <Container maxWidth="xs" sx={{ height: '100vh' }}>
        {isAuthenticated ? <ServiceTabs tab={tab} /> : <LoadingPayflowEntryLogo />}
      </Container>
    </>
  );
}
