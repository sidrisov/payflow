import { Box, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { ProfileType, SelectedIdentityType } from '../types/ProfleType';
import SearchIdentityDialog from '../components/dialogs/SearchIdentityDialog';
import { orange } from '@mui/material/colors';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import { PublicProfileCard } from '../components/cards/PublicProfileCard';
import { useAccount } from 'wagmi';
import { getProfileByAddressOrName } from '../services/user';
import { Address } from 'viem';

import PaymentDialog from '../components/dialogs/PaymentDialog';
import { PublicSearchPay } from './PublicSearchPay';
import { ProfileContext } from '../contexts/UserContext';

export default function PublicProfile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { username } = useParams();

  const [profile, setProfile] = useState<ProfileType>();
  const { profile: loggedProfile } = useContext(ProfileContext);
  const [loadingProfile, setLoadingProfile] = useState<boolean>();

  const [openSearchIdentity, setOpenSearchIdentity] = useState<boolean>(false);

  const { address } = useAccount();

  const [selectedRecipient, setSelectedRecipient] = useState<SelectedIdentityType>();

  useMemo(async () => {
    if (username) {
      setLoadingProfile(true);
      try {
        const profile = await getProfileByAddressOrName(username);
        setProfile(profile);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingProfile(false);
      }
    }
  }, [username]);

  return (
    <>
      <Helmet>
        <title> Payflow {profile ? '| ' + profile.displayName : ''} </title>
      </Helmet>
      <Box width="100%">
        {username && !loadingProfile && !profile && (
          <Stack mt={10}>
            <Typography
              variant="h6"
              fontSize={isMobile ? 16 : 20}
              textAlign="center"
              color={orange.A400}>
              Ooops, profile{' '}
              <b>
                <u>{username}</u>
              </b>{' '}
              not found 🤷🏻‍♂️
            </Typography>
            <Typography
              variant="h6"
              fontSize={isMobile ? 16 : 20}
              textAlign="center"
              color={orange.A400}>
              Try to search by social 👇🏻
            </Typography>
          </Stack>
        )}

        {loadingProfile === true ? (
          <CenteredCircularProgress />
        ) : profile ? (
          <PublicProfileCard profile={profile} />
        ) : (
          <PublicSearchPay setOpenSearchIdentity={setOpenSearchIdentity} />
        )}
      </Box>
      <SearchIdentityDialog
        address={address ?? loggedProfile?.identity}
        profileRedirect={true}
        walletMenuEnabled={!loggedProfile}
        selectIdentityCallback={(selectedIdentity) => {
          setSelectedRecipient(selectedIdentity);
        }}
        open={openSearchIdentity}
        closeStateCallback={() => {
          setOpenSearchIdentity(false);
        }}
      />
      {selectedRecipient && (
        <PaymentDialog
          open={selectedRecipient !== undefined}
          // TODO: might be undefined
          sender={
            loggedProfile && loggedProfile.defaultFlow
              ? loggedProfile.defaultFlow
              : (address as Address)
          }
          recipient={selectedRecipient}
          closeStateCallback={async () => {
            setSelectedRecipient(undefined);
          }}
        />
      )}
    </>
  );
}
