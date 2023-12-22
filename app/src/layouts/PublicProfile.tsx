import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { ProfileType } from '../types/ProfleType';
import { HomeOutlined, Search } from '@mui/icons-material';
import { API_URL } from '../utils/urlConstants';
import SearchProfileDialog from '../components/SearchProfileDialog';
import { green, grey, orange } from '@mui/material/colors';
import { AppSettings } from '../types/AppSettingsType';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import { PublicProfileCard } from '../components/PublicProfileCard';
import { SUPPORTED_CHAINS } from '../utils/networks';
import HideOnScroll from '../components/HideOnScroll';
import HomeLogo from '../components/Logo';

export default function PublicProfile({ appSettings }: { appSettings: AppSettings }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();

  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileType>();
  const [loadingProfile, setLoadingProfile] = useState<boolean>();

  const { darkMode } = appSettings;

  const [openSearchProfile, setOpenSearchProfile] = useState<boolean>(false);

  useMemo(async () => {
    if (username) {
      setLoadingProfile(true);
      try {
        const response = await axios.get(`${API_URL}/api/user/${username}`);
        const profile = (await response.data) as ProfileType;

        if (profile.defaultFlow) {
          const wallets = profile.defaultFlow?.wallets.filter((w) =>
            SUPPORTED_CHAINS.map((c) => c.id as number).includes(w.network)
          );
          profile.defaultFlow.wallets = wallets;
        }
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
      <Container maxWidth={!loadingProfile && !profile ? 'sm' : 'xs'}>
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
          <>
            <HideOnScroll>
              <AppBar
                position="sticky"
                color="transparent"
                elevation={0}
                sx={{ backdropFilter: 'blur(5px)' }}>
                <Toolbar>
                  <Box
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    flexGrow={1}>
                    <Stack direction="row" alignItems="center">
                      <IconButton onClick={() => navigate('/home')}>
                        <HomeOutlined />
                      </IconButton>
                      <HomeLogo />
                    </Stack>
                    <Box
                      ml={1}
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      component={Button}
                      color="inherit"
                      sx={{
                        width: 120,
                        borderRadius: 5,
                        border: 1,
                        borderColor: 'inherit',
                        textTransform: 'none',
                        justifyContent: 'space-evenly'
                      }}
                      onClick={async () => {
                        setOpenSearchProfile(true);
                      }}>
                      <Avatar src="payflow.png" sx={{ width: 24, height: 24 }} />
                      <Typography variant="subtitle2">Search ... </Typography>
                    </Box>
                  </Box>
                </Toolbar>
              </AppBar>
            </HideOnScroll>
            <PublicProfileCard profile={profile} />
          </>
        ) : (
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
                  <Typography
                    variant={isMobile ? 'h6' : 'h5'}
                    fontWeight="900"
                    color={green.A700}
                    sx={{ mb: 3, ml: isMobile ? -20 : 0 }}>
                    made easy
                  </Typography>
                }>
                <Typography
                  maxWidth={isMobile ? 350 : 600}
                  variant={isMobile ? 'h4' : 'h3'}
                  fontWeight="500"
                  textAlign="center">
                  Onchain Social Payments
                </Typography>
              </Badge>

              <Typography
                variant="h6"
                fontSize={isMobile ? 16 : 20}
                fontWeight="900"
                color={green.A700}
                textAlign="center">
                abstracted | gasless | non-custodial
              </Typography>

              <Typography
                variant="caption"
                fontSize={isMobile ? 14 : 16}
                color="grey"
                textAlign="center">
                farcaster | lens | ens supported
              </Typography>

              <Chip
                size="medium"
                clickable
                icon={<Avatar src="payflow.png" sx={{ width: 32, height: 32 }} />}
                variant="outlined"
                label="search & pay"
                onClick={() => {
                  setOpenSearchProfile(true);
                }}
                sx={{
                  border: 2,
                  backgroundColor: darkMode ? grey[800] : grey[50],
                  borderStyle: 'dotted',
                  borderColor: 'divider',
                  borderRadius: 10,
                  width: 220,
                  '& .MuiChip-label': { fontSize: 20 },
                  height: 50
                }}
              />
            </Stack>
          </Box>
        )}
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
