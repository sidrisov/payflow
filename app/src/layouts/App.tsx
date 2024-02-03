import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import {
  AppBar,
  IconButton,
  Toolbar,
  Box,
  Stack,
  Typography,
  Button,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';

import { Home, HomeOutlined, AppsOutlined } from '@mui/icons-material';

import { ProfileContext } from '../contexts/UserContext';
import HideOnScroll from '../components/HideOnScroll';
import { useEnsAddress, useReadContract } from 'wagmi';

import AggregatorV2V3Interface from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/interfaces/AggregatorV2V3Interface.sol/AggregatorV2V3Interface.json';
import { Chain, formatUnits } from 'viem';
import { ProfileType } from '../types/ProfleType';
import { AppSettings } from '../types/AppSettingsType';
import { ProfileMenu } from '../components/menu/ProfileMenu';
import SearchIdentityDialog from '../components/dialogs/SearchIdentityDialog';
import HomeLogo from '../components/Logo';
import { comingSoonToast } from '../components/Toasts';
import ProfileAvatar from '../components/avatars/ProfileAvatar';
import DefaultFlowOnboardingDialog from '../components/dialogs/DefaultFlowOnboardingDialog';

export default function AppLayout({
  profile,
  appSettings,
  setAppSettings
}: {
  profile: ProfileType;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();

  const [walletBalances, setWalletBalances] = useState<Map<string, bigint>>(new Map());
  const [smartAccountAllowedChains, setSmartAccountAllowedChains] = useState<Chain[]>([]);

  const [authorized, setAuthorized] = useState<boolean>(false);

  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openSearchIdentity, setOpenSearchIdentity] = useState(false);

  const location = useLocation();

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
      select: (data) => Number(formatUnits(data as bigint, 8)),
      staleTime: 10_000
    }
  });

  useEffect(() => {
    if (profile && profile.username) {
      setAuthorized(true);
    } else {
      navigate('/connect');
    }
  }, [profile]);

  return (
    <ProfileContext.Provider
      value={{
        isAuthenticated: authorized,
        profile,
        appSettings,
        setAppSettings,
        smartAccountAllowedChains,
        setSmartAccountAllowedChains,
        walletBalances,
        setWalletBalances,
        ethUsdPrice
      }}>
      {authorized && (
        <Box height="100vh" display="flex" flexDirection="column" justifyContent="flex-start">
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
                  <HomeLogo />
                  <Stack direction="row" alignItems="center">
                    <IconButton
                      color={location.pathname === '/home' ? 'inherit' : undefined}
                      onClick={() => navigate('/home')}>
                      {location.pathname === '/home' ? <Home /> : <HomeOutlined />}
                    </IconButton>

                    <IconButton
                      color={location.pathname === '/flows' ? 'inherit' : undefined}
                      onClick={() => comingSoonToast()}>
                      <AppsOutlined />
                    </IconButton>

                    {/*
                      <IconButton
                        color={location.pathname === '/requests' ? 'inherit' : undefined}
                        onClick={() => comingSoonToast()}>
                        {location.pathname === '/requests' ? <Payments /> : <PaymentsOutlined />}
                      </IconButton> */}

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
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {/*                       <IconButton color="inherit" onClick={() => comingSoonToast()}>
                        <Badge variant="dot" color="info">
                          <NotificationsOutlined />
                        </Badge>
                      </IconButton> */}

                    <IconButton
                      size="small"
                      onClick={async (event) => {
                        setProfileMenuAnchorEl(event.currentTarget);
                        setOpenProfileMenu(true);
                      }}>
                      <ProfileAvatar profile={profile} sx={{ width: 36, height: 36 }} />
                    </IconButton>
                  </Stack>
                </Box>
              </Toolbar>
            </AppBar>
          </HideOnScroll>

          {profile && profile.defaultFlow && (
            <Box display="flex" mt={3} height="100%">
              <Outlet />
            </Box>
          )}
        </Box>
      )}
      <ProfileMenu
        profile={profile}
        anchorEl={profileMenuAnchorEl}
        open={openProfileMenu}
        onClose={() => setOpenProfileMenu(false)}
        closeStateCallback={() => setOpenProfileMenu(false)}
      />
      <SearchIdentityDialog
        address={profile.identity}
        profileRedirect={true}
        open={openSearchIdentity}
        closeStateCallback={() => {
          setOpenSearchIdentity(false);
        }}
      />
      {profile && !profile.defaultFlow && (
        <DefaultFlowOnboardingDialog
          fullScreen={isMobile}
          open={!profile.defaultFlow}
          profile={profile}
          closeStateCallback={() => {}}
        />
      )}
    </ProfileContext.Provider>
  );
}
