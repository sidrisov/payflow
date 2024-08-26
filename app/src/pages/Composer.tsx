import { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Avatar, Box, Container, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ElectricBolt } from '@mui/icons-material';
import CastActionButton from '../components/buttons/CastActionButton';
import { useSearchParams } from 'react-router-dom';
import SearchIdentityDialog from '../components/dialogs/SearchIdentityDialog';
import { ProfileContext } from '../contexts/UserContext';
import { SelectedIdentityType } from '../types/ProfileType';
import { Address } from 'viem';
import PayComposerActionDialog from '../components/dialogs/PayComposerActionDialog';
import { useIdentity } from '../utils/queries/profiles';
import { PiPersonSimpleRunBold, PiTipJar } from 'react-icons/pi';
import UsefulComposerActionDialog from '../components/dialogs/UsefulComposerActionDialog';

export default function Composer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');
  const recipientIdentity = searchParams.get('recipient');

  const { isLoading: isRecipientFetchingLoading, data: fetchedRecipientIdentity } = useIdentity(
    recipientIdentity as string
  );

  const [openComposerAction, setOpenComposerAction] = useState<string | undefined>(
    action as string
  );

  const { profile } = useContext(ProfileContext);
  const [openSearchIdentity, setOpenSearchIdentity] = useState<boolean>(
    openComposerAction === 'pay' && !isRecipientFetchingLoading
  );

  const [recipient, setRecipient] = useState<SelectedIdentityType>();

  useEffect(() => {
    if (fetchedRecipientIdentity) {
      setRecipient({
        identity: fetchedRecipientIdentity,
        type: fetchedRecipientIdentity.profile ? 'profile' : 'address'
      });
    }
  }, [isRecipientFetchingLoading, fetchedRecipientIdentity]);

  return (
    <>
      <Helmet>
        <title> Payflow | Composer Actions </title>
      </Helmet>

      {openComposerAction === 'pay' && recipient && profile && (
        <PayComposerActionDialog
          open={recipient != null}
          sender={{
            type: 'profile',
            identity: {
              address: profile.identity as Address,
              profile: profile
            }
          }}
          recipient={recipient}
          setOpenSearchIdentity={setOpenSearchIdentity}
          closeStateCallback={async () => {
            setRecipient(undefined);
          }}
        />
      )}

      {openComposerAction === 'useful' && profile && (
        <UsefulComposerActionDialog
          open={true}
          closeStateCallback={() => {
            setOpenComposerAction(undefined);
          }}
          onClose={() => {
            setOpenComposerAction(undefined);
          }}
        />
      )}

      {openSearchIdentity && profile && (
        <SearchIdentityDialog
          hideBackButton={!Boolean(recipient)}
          title="Search Recipient"
          address={profile.identity}
          open={openSearchIdentity}
          closeStateCallback={async () => {
            setOpenSearchIdentity(false);
          }}
          selectIdentityCallback={async (recipient) => {
            setRecipient(recipient);
          }}
        />
      )}

      {!action && (
        <Container maxWidth="xs" sx={{ height: '100%' }}>
          <Box
            height="100%"
            display="flex"
            flexDirection="column"
            justifyContent={isMobile ? 'space-between' : 'flex-start'}
            sx={{ p: 3 }}>
            <Stack
              p={3}
              spacing={3}
              alignItems="center"
              border={1.5}
              borderRadius={5}
              borderColor="divider">
              <Avatar src="/farcaster.svg" variant="rounded" />
              <Typography variant="h6" align="center">
                Farcaster Composer Actions
              </Typography>
              <Stack spacing={1} alignItems="center">
                <CastActionButton
                  title="Pay"
                  description="Send Payments"
                  onClick={async () => {
                    setOpenComposerAction('pay');
                    setOpenSearchIdentity(true);
                  }}
                  startIcon={<ElectricBolt />}
                />
                <CastActionButton
                  title="Useful"
                  description="Information for you"
                  onClick={async () => {
                    setOpenComposerAction('useful');
                  }}
                  startIcon={<PiPersonSimpleRunBold />}
                />
                <CastActionButton
                  title="Jar"
                  description="Collect contributions"
                  onClick={async () => {
                    setOpenComposerAction('jar');
                  }}
                  startIcon={<PiTipJar size={20} />}
                />
              </Stack>
            </Stack>
          </Box>
        </Container>
      )}
    </>
  );
}
