import { Box, Stack, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { SelectedIdentityType } from '../types/ProfileType';
import SearchIdentityDialog from '../components/dialogs/SearchIdentityDialog';
import { orange } from '@mui/material/colors';
import { PublicProfileCard } from '../components/cards/PublicProfileCard';
import { useAccount } from 'wagmi';
import { Address } from 'viem';

import PaymentDialog from '../components/dialogs/PaymentDialog';
import { PublicSearchPay } from './PublicSearchPay';
import { ProfileContext } from '../contexts/UserContext';
import { useIdentity } from '../utils/queries/profiles';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import { useMobile } from '../utils/hooks/useMobile';

export default function PublicProfile() {
  const isMobile = useMobile();

  const { username, fid } = useParams();
  const { isLoading: isProfileLoading, data: identity } = useIdentity(username, fid);
  const { profile: loggedProfile } = useContext(ProfileContext);

  const [openSearchIdentity, setOpenSearchIdentity] = useState<boolean>(false);
  const { address } = useAccount();
  const [selectedRecipient, setSelectedRecipient] = useState<SelectedIdentityType>();

  const displayName =
    identity?.profile?.displayName ??
    identity?.meta?.socials[0]?.profileDisplayName ??
    identity?.meta?.ens;

  return (
    <>
      <Helmet>
        <title> Payflow {displayName ? '| ' + displayName : ''} </title>
      </Helmet>
      <Box display="flex" flexDirection="column" height="100vh" width="100%">
        {username && !isProfileLoading && !identity && (
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

        {isProfileLoading === true ? (
          <LoadingPayflowEntryLogo />
        ) : identity ? (
          <Box flexGrow={1} overflow="hidden" sx={{ mb: 20 }} border={1}>
            <PublicProfileCard identity={identity} />
          </Box>
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
          paymentType={loggedProfile ? 'payflow' : 'wallet'}
          open={selectedRecipient !== undefined}
          sender={{
            type: loggedProfile ? 'profile' : 'address',
            identity: {
              address:
                loggedProfile && loggedProfile.defaultFlow
                  ? (loggedProfile?.identity as Address)
                  : (address?.toLowerCase() as Address),
              ...(loggedProfile && loggedProfile.defaultFlow && { profile: loggedProfile })
            }
          }}
          recipient={selectedRecipient}
          closeStateCallback={async () => {
            setSelectedRecipient(undefined);
          }}
        />
      )}
    </>
  );
}
