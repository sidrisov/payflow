import { Container } from '@mui/material';
import { lazy, useContext, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ProfileContext } from '../contexts/UserContext';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import PayflowBalanceDialog from '../components/dialogs/PayflowBalanceDialog';
import { useNavigate } from 'react-router';

export default function CreatePayflowWallet() {
  const { profile } = useContext(ProfileContext);
  const navigate = useNavigate();
  // specify height, otherwise the privy dialog won't be properly displayed
  return (
    <>
      <Helmet>
        <title> Payflow | Create Wallet </title>
      </Helmet>
      <Container maxWidth="md" sx={{ height: '100vh' }}>
        <LoadingPayflowEntryLogo />
        {profile && (
          <PayflowBalanceDialog
            open={true}
            profile={profile}
            closeStateCallback={() => {
              navigate('/');
            }}
          />
        )}
      </Container>
    </>
  );
}
