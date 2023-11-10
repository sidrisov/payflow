import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Fab,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { ProfileType } from '../types/ProfleType';
import { useEnsName } from 'wagmi';
import {
  ArrowForward,
  AttachMoney,
  Campaign,
  MonetizationOn,
  Payment,
  Savings,
  Search,
  Send
} from '@mui/icons-material';
import { useLazyQuery } from '@airstack/airstack-react';
import { FlowType } from '../types/FlowType';
import QRCode from 'react-qr-code';
import SearchProfileDialog from '../components/SearchProfileDialog';
import { API_URL } from '../utils/urlConstants';
import { ProfileSection } from '../components/ProfileSection';
import { comingSoonText, comingSoonToast } from '../components/Toasts';
import SocialPresenceChipWithLink from '../components/SocialPresenceChipWithLink';
import { querySocialsMinimal } from '../utils/searchProfile';

const DAPP_URL = import.meta.env.VITE_PAYFLOW_SERVICE_DAPP_URL;

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileType>();
  const [flows, setFlows] = useState<FlowType[]>();

  const [openSearchProfile, setOpenSearchProfile] = useState<boolean>(false);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();

  const { data: ensName } = useEnsName({
    address: profile?.address,
    chainId: 1
  });

  const [fetch, { data: socialInfo, loading }] = useLazyQuery(
    querySocialsMinimal,
    { identity: profile?.address },
    {
      cache: true
    }
  );

  async function fetchFlows(profile: ProfileType) {
    try {
      const response = await axios.get(`${API_URL}/api/flows/public/${profile.address}`, {
        withCredentials: true
      });

      setFlows(response.data);
    } catch (error) {
      console.log(error);
    }
  }

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
      fetchFlows(profile);
    }
  }, [profile]);

  return (
    <>
      <Helmet>
        <title> PayFlow | Profile </title>
      </Helmet>
      <Container maxWidth="sm">
        <Box m={3} display="flex" flexDirection="row" alignItems="center" alignSelf="stretch">
          <Chip
            size="medium"
            clickable
            icon={<Search color="inherit" />}
            variant="outlined"
            label="Search ... "
            onClick={() => {
              setOpenSearchProfile(true);
            }}
            sx={{
              flexGrow: 1,
              maxWidth: 500,
              '& .MuiChip-root': {
                borderRadius: 5
              },
              '& .MuiChip-label': { fontSize: 18 },
              height: 50
            }}
          />
        </Box>

        {profile && (
          <Card
            elevation={10}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-evenly',
              m: 2,
              p: 2,
              border: 2,
              borderColor: 'divider',
              borderStyle: 'double',
              borderRadius: 5
            }}>
            <Stack spacing={1} direction="column" alignItems="center">
              <ProfileSection profile={profile} avatarSize={48} />
              {loading && <CircularProgress color="inherit" size={25} />}
              {socialInfo && (
                <Box
                  flexWrap="wrap"
                  display="flex"
                  justifyContent="space-evenly"
                  alignItems="center">
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
                  Send
                </Button>
              </Stack>
            </Stack>
          </Card>
        )}

        {profile && (
          <Stack
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
        )}

        <Typography variant="h6" textAlign="center">
          {comingSoonText}
        </Typography>

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
                  value={`${DAPP_URL}/send/${flow.uuid}`}
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
                      <Tooltip
                        key={`wallet_tooltip_${flow.uuid}_${i}`}
                        title={flow.wallets[i].network}>
                        <Avatar src={'/networks/' + flow.wallets[i].network + '.png'} />
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                </Box>
              </Box>
              <IconButton
                color="inherit"
                onClick={async () => {
                  navigate(`/send/${flow.uuid}`);
                }}
                sx={{ ml: 1, border: 1.5, borderStyle: 'dashed' }}>
                <ArrowForward fontSize="medium" />
              </IconButton>
            </Card>
          ))} */}
      </Container>
      <Fab
        variant="circular"
        onClick={() => {
          setOpenSearchProfile(true);
        }}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Search />
      </Fab>
      <SearchProfileDialog
        maxWidth="sm"
        fullWidth
        open={openSearchProfile}
        closeStateCallback={() => {
          setOpenSearchProfile(false);
        }}
      />
    </>
  );
}
