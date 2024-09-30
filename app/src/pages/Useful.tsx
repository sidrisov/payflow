import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container } from '@mui/material';

import { ProfileContext } from '../contexts/UserContext';
import { UsefulTabs } from '../components/useful/UsefulTabs';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import { useSearchParams } from 'react-router-dom';

export default function Useful() {
  const { isAuthenticated } = useContext(ProfileContext);
  const tab = useSearchParams()[0].get('tab') ?? undefined;

  return (
    <>
      <Helmet>
        <title> Payflow | Useful </title>
      </Helmet>
      <Container maxWidth="xs" sx={{ height: '100vh' }}>
        {isAuthenticated ? <UsefulTabs tab={tab} /> : <LoadingPayflowEntryLogo />}
      </Container>
    </>
  );
}
