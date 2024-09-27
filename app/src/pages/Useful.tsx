import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container } from '@mui/material';

import { ProfileContext } from '../contexts/UserContext';
import { UsefulTabs } from '../components/useful/UsefulTabs';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';

export default function Useful() {
  const { isAuthenticated } = useContext(ProfileContext);

  return (
    <>
      <Helmet>
        <title> Payflow | Useful </title>
      </Helmet>
      <Container maxWidth="xs" sx={{ height: '100vh' }}>
        {isAuthenticated ? <UsefulTabs /> : <LoadingPayflowEntryLogo />}
      </Container>
    </>
  );
}
