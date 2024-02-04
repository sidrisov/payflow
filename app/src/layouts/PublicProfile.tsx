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
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { ProfileType, SelectedIdentityType } from '../types/ProfleType';
import { HomeOutlined, Menu } from '@mui/icons-material';
import SearchIdentityDialog from '../components/dialogs/SearchIdentityDialog';
import { green, grey, orange } from '@mui/material/colors';
import { AppSettings } from '../types/AppSettingsType';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import { PublicProfileCard } from '../components/cards/PublicProfileCard';
import HideOnScroll from '../components/HideOnScroll';
import HomeLogo from '../components/Logo';
import { WalletMenu } from '../components/menu/WalletMenu';
import { useAccount, useEnsAddress, useReadContract } from 'wagmi';
import { getProfileByAddressOrName, me } from '../services/user';
import { ProfileContext } from '../contexts/UserContext';
import { Address, formatUnits } from 'viem';

import AggregatorV2V3Interface from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/interfaces/AggregatorV2V3Interface.sol/AggregatorV2V3Interface.json';
import PaymentDialog from '../components/dialogs/PaymentDialog';
import { ProfileMenu } from '../components/menu/ProfileMenu';
import ProfileAvatar from '../components/avatars/ProfileAvatar';

export default function PublicProfile({
  appSettings,
  setAppSettings
}: {
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();

  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileType>();
  const [loggedProfile, setLoggedProfile] = useState<ProfileType>();
  const [loadingProfile, setLoadingProfile] = useState<boolean>();

  const { darkMode } = appSettings;

  const [openSearchIdentity, setOpenSearchIdentity] = useState<boolean>(false);
  const [walletMenuAnchorEl, setWalletMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openWalletMenu, setOpenWalletMenu] = useState(false);

  const { address } = useAccount();

  const [selectedRecipient, setSelectedRecipient] = useState<SelectedIdentityType>();

  const { isSuccess: isEnsSuccess, data: ethUsdPriceFeedAddress } = useEnsAddress({
    name: 'eth-usd.data.eth',
    chainId: 1,
    query: {
      staleTime: 300_000
    }
  });

  const { data: ethUsdPrice } = useReadContract({
    chainId: 1,
    address: ethUsdPriceFeedAddress ?? undefined,
    abi: AggregatorV2V3Interface.abi,
    functionName: 'latestAnswer',
    query: {
      enabled: isEnsSuccess && ethUsdPriceFeedAddress !== undefined,
      staleTime: 10_000,
      select: (data) => Number(formatUnits(data as bigint, 8))
    }
  });

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

  useMemo(async () => {
    if (!loggedProfile) {
      setLoggedProfile(await me());
    }
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        isAuthenticated: false,
        appSettings,
        setAppSettings,
        ethUsdPrice,
        profile: loggedProfile as any
      }}>
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
                      <IconButton color="inherit" onClick={() => navigate('/home')}>
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
                        setOpenSearchIdentity(true);
                      }}>
                      <Avatar src="payflow.png" sx={{ width: 24, height: 24 }} />
                      <Typography variant="subtitle2">Search ... </Typography>
                    </Box>

                    <IconButton
                      color="inherit"
                      onClick={async (event) => {
                        setWalletMenuAnchorEl(event.currentTarget);
                        setOpenWalletMenu(true);
                      }}>
                      {loggedProfile ? (
                        <ProfileAvatar profile={loggedProfile} sx={{ width: 36, height: 36 }} />
                      ) : (
                        <Menu />
                      )}
                    </IconButton>
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
                  setOpenSearchIdentity(true);
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
      <SearchIdentityDialog
        address={address}
        profileRedirect={true}
        walletMenuEnabled={true}
        selectIdentityCallback={(selectedIdentity) => {
          setSelectedRecipient(selectedIdentity);
        }}
        open={openSearchIdentity}
        closeStateCallback={() => {
          setOpenSearchIdentity(false);
        }}
      />
      {selectedRecipient && ((loggedProfile && loggedProfile.defaultFlow) || address) && (
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
      {loggedProfile ? (
        <ProfileMenu
          loginRedirectOnLogout={false}
          profile={loggedProfile}
          anchorEl={walletMenuAnchorEl}
          open={openWalletMenu}
          onClose={() => setOpenWalletMenu(false)}
          closeStateCallback={() => setOpenWalletMenu(false)}
        />
      ) : (
        <WalletMenu
          anchorEl={walletMenuAnchorEl}
          open={openWalletMenu}
          onClose={() => setOpenWalletMenu(false)}
          closeStateCallback={() => setOpenWalletMenu(false)}
        />
      )}
    </ProfileContext.Provider>
  );
}
