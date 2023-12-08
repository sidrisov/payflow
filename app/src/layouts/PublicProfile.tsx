import {
  Badge,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography} from '@mui/material';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { ProfileType } from '../types/ProfleType';
import { useEnsName } from 'wagmi';
import { AttachMoney, Search, Send } from '@mui/icons-material';
import { useLazyQuery } from '@airstack/airstack-react';
import { API_URL } from '../utils/urlConstants';
import { ProfileSection } from '../components/ProfileSection';
import { comingSoonToast } from '../components/Toasts';
import SocialPresenceChipWithLink from '../components/SocialPresenceChipWithLink';
import { QUERY_SOCIALS_MINIMAL } from '../services/socials';
import SearchProfileDialog from '../components/SearchProfileDialog';
import { green, grey } from '@mui/material/colors';
import { AppSettings } from '../types/AppSettingsType';

export default function PublicProfile({ appSettings }: { appSettings: AppSettings }) {
  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileType>();

  const { darkMode } = appSettings;

  const [openSearchProfile, setOpenSearchProfile] = useState<boolean>(false);

  const { data: ensName } = useEnsName({
    address: profile?.address,
    chainId: 1
  });

  const [fetch, { data: socialInfo, loading }] = useLazyQuery(
    QUERY_SOCIALS_MINIMAL,
    { identity: profile?.address },
    {
      cache: true
    }
  );

  useMemo(async () => {
    if (username) {
      try {
        const response = await axios.get(`${API_URL}/api/user/${username}`, {
          withCredentials: true
        });
        const profile = (await response.data) as ProfileType;
        setProfile(profile);

        console.log(profile);
      } catch (error) {
        console.error(error);
      }
    }
  }, [username]);

  useMemo(async () => {
    if (profile) {
      console.log(profile);
      fetch();
    }
  }, [profile]);

  return (
    <>
      <Helmet>
        <title> Payflow {profile ? '| ' + profile.displayName : ''} </title>
      </Helmet>
      <Container maxWidth="xs">
        {!profile && (
          <Box
            position="absolute"
            display="flex"
            flexDirection="column"
            alignItems="center"
            boxSizing="border-box"
            justifyContent="center"
            sx={{ inset: 0 }}>
            <Stack spacing={1} alignItems="center" sx={{ border: 0 }}>
              <Badge
                badgeContent={
                  <Typography variant="h5" fontWeight="900" color={green.A700} sx={{ mb: 3 }}>
                    made easy
                  </Typography>
                }>
                <Typography variant="h3" fontWeight="500" textAlign="center">
                  Onchain Social Payments
                </Typography>
              </Badge>

              <Typography variant="caption" fontSize={16} color="grey">
                Safe, gasless, farcaster/lens/ens supported
              </Typography>

              <Chip
                size="medium"
                clickable
                icon={<Search color="inherit" />}
                variant="outlined"
                label="search & pay your friend"
                onClick={() => {
                  setOpenSearchProfile(true);
                }}
                sx={{
                  border: 2,
                  backgroundColor: darkMode ? grey[800] : grey[50],
                  borderStyle: 'dotted',
                  borderColor: 'divider',
                  borderRadius: 10,
                  width: 300,
                  '& .MuiChip-label': { fontSize: 20 },
                  height: 50
                }}
              />
            </Stack>
          </Box>
        )}
        {profile && (
          <>
            <Card
              elevation={10}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-evenly',
                m: 2,
                mt: 5,
                p: 2,
                border: 2,
                borderColor: 'divider',
                borderStyle: 'double',
                borderRadius: 5
              }}>
              <Stack spacing={1} direction="column" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  {/*                   <Verified fontSize="small" color="success" sx={{ color: green[500] }} />
                   */}
                  <ProfileSection profile={profile} avatarSize={48} maxWidth={300} />
                </Stack>

                {loading && <CircularProgress color="inherit" size={25} />}
                {socialInfo && (
                  <Box flexWrap="wrap" display="flex" justifyContent="center" alignItems="center">
                    <SocialPresenceChipWithLink
                      type={ensName ? 'ens' : 'address'}
                      name={ensName ?? profile.address}
                    />

                    {socialInfo.Wallet.socials &&
                      socialInfo.Wallet.socials
                        .filter((s: any) => s.profileName)
                        .map((s: any) => (
                          <SocialPresenceChipWithLink type={s.dappName} name={s.profileName} />
                        ))}
                    {socialInfo.Wallet.xmtp && socialInfo.Wallet.xmtp[0].isXMTPEnabled && (
                      <SocialPresenceChipWithLink type="xmtp" name={ensName ?? profile.address} />
                    )}
                  </Box>
                )}
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    color="inherit"
                    variant="outlined"
                    endIcon={<AttachMoney />}
                    onClick={() => comingSoonToast()}
                    sx={{ borderRadius: 5, textTransform: 'lowercase' }}>
                    Tip
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    endIcon={<Send />}
                    onClick={() => comingSoonToast()}
                    sx={{ borderRadius: 5, textTransform: 'lowercase' }}>
                    Pay
                  </Button>
                </Stack>
              </Stack>
            </Card>

            {/*  <Stack
              overflow="scroll"
              m={1}
              spacing={1}
              justifyContent={isSmallScreen ? 'flex-start' : 'center'}
              direction="row"
              p={1}>
              <Chip
                clickable
                icon={<MonetizationOn />}
                label="Tipping"
                sx={{ backgroundColor: 'inherit' }}></Chip>
              <Chip icon={<Savings />} label="Jars"></Chip>
              <Chip
                clickable
                icon={<Payment />}
                label="Subscriptions"
                sx={{ backgroundColor: 'inherit' }}></Chip>
              <Chip
                clickable
                icon={<Campaign />}
                label="Campaigns"
                sx={{ backgroundColor: 'inherit' }}></Chip>
            </Stack>

            <Typography variant="h6" textAlign="center">
              {comingSoonText}
            </Typography> */}
          </>
        )}
        {/* {flows &&
          flows.map((flow) => (
            <Card
              key={`flow_card_${flow.uuid}`}
              elevation={10}
              sx={{
                m: 2,
                p: 2,
                border: 3,
                borderRadius: 5,
                borderStyle: 'double',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center'
              }}>
              <Box
                sx={{
                  p: 0.8,
                  pb: 0.4,
                  borderRadius: 5,
                  border: 3,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'inherit'
                }}>
                <QRCode
                  size={100}
                  alignmentBaseline="baseline"
                  alphabetic="true"
                  value={`${DAPP_URL}/jar/${flow.uuid}`}
                />
              </Box>
              <Box
                ml={1}
                display="flex"
                flexDirection="column"
                justifyContent="flex-start"
                alignContent="flex-start"
                width={300}>
                <Box display="flex" flexDirection="row" justifyContent="space-between">
                  <Stack spacing={1}>
                    <Typography fontSize={20} fontWeight="bold" maxHeight={60} overflow="scroll">
                      {flow.title}
                    </Typography>
                    <Typography fontSize={12} fontWeight="bold" maxHeight={50} overflow="scroll">
                      {flow.description}
                    </Typography>
                  </Stack>
                </Box>
                <Box
                  display="flex"
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center">
                  <Typography variant="subtitle2">${0}</Typography>
                  <AvatarGroup
                    max={5}
                    total={flow.wallets.length}
                    sx={{
                      '& .MuiAvatar-root': { width: 20, height: 20, fontSize: 10 }
                    }}>
                    {[...Array(Math.min(4, flow.wallets.length))].map((_item, i) => (
                
                        <NetworkAvatar tooltip network={flow.wallets[i].network} />
                    ))}
                  </AvatarGroup>
                </Box>
              </Box>
              <IconButton
                color="inherit"
                onClick={async () => {
                  navigate(`/jar/${flow.uuid}`);
                }}
                sx={{ ml: 1, border: 1.5, borderStyle: 'dashed' }}>
                <ArrowForward fontSize="medium" />
              </IconButton>
            </Card>
          ))} */}
      </Container>
      <SearchProfileDialog
        open={openSearchProfile}
        sx={{
          backdropFilter: 'blur(10px)'
        }}
        closeStateCallback={() => {
          setOpenSearchProfile(false);
        }}
      />
    </>
  );
}
