import { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Card, Container, Stack, Tooltip, Typography } from '@mui/material';
import { ElectricBolt, InfoOutlined } from '@mui/icons-material';
import CastActionButton from '../components/buttons/CastActionButton';
import { useSearchParams, useNavigate } from 'react-router';
import { ProfileContext } from '../contexts/UserContext';
import { PiPersonSimpleRunBold, PiTipJar } from 'react-icons/pi';
import ContributionJarComposerDialog from '../components/dialogs/ContributionJarComposerDialog';
import { RiApps2Line } from 'react-icons/ri';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import ActivityComposerActionDialog from '../components/dialogs/ActivityComposerActionDialog';
import { TbArrowsDoubleNeSw } from 'react-icons/tb';

export default function Composer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recipient = searchParams.get('recipient');
  const action = searchParams.get('action');

  const [openComposerAction, setOpenComposerAction] = useState<string | undefined>(
    action as string
  );

  const { profile } = useContext(ProfileContext);

  useEffect(() => {
    if (openComposerAction === 'pay') {
      const paymentUrl = recipient ? `/payment/create?recipient=${recipient}` : '/payment/create';
      navigate(paymentUrl);
    } else if (openComposerAction === 'earn' || openComposerAction === 'useful') {
      navigate('/~/claimables');
    }
  }, [openComposerAction, recipient, navigate]);

  return (
    <>
      <Helmet>
        <title> Payflow | Composer Actions </title>
      </Helmet>

      <Container maxWidth="md" sx={{ height: '80vh' }}>
        {!action ? (
          <Stack
            m={1}
            p={3}
            spacing={3}
            component={Card}
            elevation={5}
            alignItems="center"
            borderRadius={5}
            minWidth={300}
            maxWidth={350}>
            <Stack pl={2} direction="row" spacing={1} alignItems="center" alignSelf="flex-start">
              <RiApps2Line size={30} />
              <Typography fontSize={20} fontWeight="bold">
                Payflow Actions
              </Typography>
            </Stack>
            <Stack width="100%" spacing={2} alignItems="center">
              <CastActionButton
                title="Pay"
                description="New payment frame"
                onClick={async () => {
                  const paymentUrl = recipient
                    ? `/payment/create?recipient=${recipient}`
                    : '/payment/create';
                  navigate(paymentUrl);
                }}
                startIcon={<ElectricBolt sx={{ width: 25, height: 25 }} />}
              />
              <CastActionButton
                title="Earn"
                description="Claimables and other earnings"
                onClick={async () => {
                  setOpenComposerAction('earn');
                }}
                startIcon={<PiPersonSimpleRunBold size={25} />}
              />
              <CastActionButton
                title="Activity"
                description="Your Payflow activity"
                onClick={async () => {
                  setOpenComposerAction('activity');
                }}
                startIcon={<TbArrowsDoubleNeSw size={25} />}
              />
              <CastActionButton
                title="Jar"
                description="Create contribution frame"
                earlyFeature
                onClick={async () => {
                  setOpenComposerAction('jar');
                }}
                startIcon={<PiTipJar size={25} />}
              />
            </Stack>
            <Box display="flex" alignItems="center">
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'error.main',
                  display: 'inline-block',
                  mr: 1
                }}
              />
              <Typography variant="caption" fontWeight="bold" color="text.secondary">
                Early feature
              </Typography>
              <Tooltip title="These features are in early development and may be subject to changes or limitations.">
                <InfoOutlined fontSize="small" sx={{ ml: 0.5, color: 'text.secondary' }} />
              </Tooltip>
            </Box>
          </Stack>
        ) : (
          <LoadingPayflowEntryLogo />
        )}

        {openComposerAction === 'jar' && profile && (
          <ContributionJarComposerDialog
            open={true}
            closeStateCallback={() => {
              setOpenComposerAction(undefined);
            }}
            onClose={() => {
              setOpenComposerAction(undefined);
            }}
          />
        )}
        {openComposerAction === 'activity' && profile && (
          <ActivityComposerActionDialog
            open={true}
            onClose={() => {
              setOpenComposerAction(undefined);
            }}
          />
        )}
      </Container>
    </>
  );
}
