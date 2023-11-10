import { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import {
  AppBar,
  IconButton,
  Toolbar,
  Box,
  Drawer,
  Stack,
  Avatar,
  Typography,
  Button
} from '@mui/material';

import CustomThemeProvider from '../theme/CustomThemeProvider';
import {
  LightModeOutlined,
  DarkModeOutlined,
  Menu as MenuIcon,
  Search,
  SettingsApplications,
  Payment,
  Payments,
  Apps,
  Home
} from '@mui/icons-material';

import Nav from '../components/Navigation';

import { UserContext } from '../contexts/UserContext';
import HideOnScroll from '../components/HideOnScroll';
import { useAccount, useContractRead, useEnsAddress } from 'wagmi';
import axios from 'axios';
import { toast } from 'react-toastify';

import AggregatorV2V3Interface from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/interfaces/AggregatorV2V3Interface.sol/AggregatorV2V3Interface.json';
import { formatUnits } from 'viem';
import { shortenWalletAddressLabel } from '../utils/address';
import { FlowType } from '../types/FlowType';
import { ProfileType } from '../types/ProfleType';
import { AppSettings } from '../types/AppSettingsType';
import { ProfileMenu } from '../components/ProfileMenu';
import SearchProfileDialog from '../components/SearchProfileDialog';
import { API_URL } from '../utils/urlConstants';
import HomeLogo from '../components/Logo';

const drawerWidth = 151;

export default function AppLayout({
  profile,
  appSettings,
  setAppSettings
}: {
  profile: ProfileType;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}) {
  const navigate = useNavigate();

  const { isConnected, address, connector } = useAccount({
    async onDisconnect() {
      await axios.get(`${API_URL}/api/auth/logout`, { withCredentials: true });
      navigate('/connect');
    }
  });

  const [walletBalances, setWalletBalances] = useState<Map<string, bigint>>(new Map());
  const [flows, setFlows] = useState<FlowType[]>();
  const [smartAccountAllowedChains, setSmartAccountAllowedChains] = useState<string[]>([]);
  const [initiateFlowsRefresh, setInitiateFlowsRefresh] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);

  const [authorized, setAuthorized] = useState<boolean>(false);

  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openSearchProfile, setOpenSearchProfile] = useState(false);

  const { isSuccess: isEnsSuccess, data: ethUsdPriceFeedAddress } = useEnsAddress({
    name: 'eth-usd.data.eth',
    chainId: 1,
    cacheTime: 60_000
  });

  const { data: ethUsdPrice } = useContractRead({
    enabled: isEnsSuccess && ethUsdPriceFeedAddress !== undefined,
    chainId: 1,
    address: ethUsdPriceFeedAddress ?? undefined,
    abi: AggregatorV2V3Interface.abi,
    functionName: 'latestAnswer',
    select: (data) => Number(formatUnits(data as bigint, 8)),
    cacheTime: 60_000
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  async function fetchFlows() {
    try {
      const response = await axios.get(`${API_URL}/api/flows`, { withCredentials: true });

      setFlows(
        (response.data as FlowType[]).sort((a, b) => {
          if (a.uuid === profile.defaultFlow?.uuid) {
            return -1;
          }

          let fa = a.title.toLowerCase(),
            fb = b.title.toLowerCase();

          if (fa < fb) {
            return -1;
          }
          if (fa > fb) {
            return 1;
          }
          return 0;
        })
      );
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (isConnected && profile) {
      if (profile.address === address) {
        if (profile.username && profile.defaultFlow) {
          setAuthorized(true);
          return;
        }
      } else {
        toast.error(
          `Please, logout or switch wallet! Connected wallet is different from signed in: ${shortenWalletAddressLabel(
            profile.address
          )}`,
          { autoClose: false }
        );
      }
    }

    navigate('/connect');
  }, [isConnected, address, profile]);

  useMemo(async () => {
    if (initiateFlowsRefresh && flows) {
      setInitiateFlowsRefresh(false);
      await fetchFlows();
    }
  }, [flows, initiateFlowsRefresh]);

  useMemo(async () => {
    if (authorized) {
      await fetchFlows();
    }
  }, [authorized]);

  const drawer = <Nav />;
  return (
    <CustomThemeProvider darkMode={appSettings.darkMode}>
      <UserContext.Provider
        value={{
          isAuthenticated: authorized,
          profile,
          appSettings,
          setAppSettings,
          flows,
          setFlows,
          smartAccountAllowedChains,
          setSmartAccountAllowedChains,
          setInitiateFlowsRefresh,
          walletBalances,
          setWalletBalances,
          ethUsdPrice
        }}>
        {authorized && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-evenly'
            }}>
            {/* <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
              <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                  keepMounted: true
                }}
                sx={{
                  display: { xs: 'block', sm: 'none' },
                  '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
                }}>
                {drawer}
              </Drawer>
              {
                <Drawer
                  variant="permanent"
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
                  }}
                  open>
                  {drawer}
                </Drawer>
              }
            </Box> */}
            <Box flexGrow={1}>
              <HideOnScroll>
                <AppBar
                  position="sticky"
                  color="transparent"
                  elevation={0}
                  sx={{ backdropFilter: 'blur(5px)' }}>
                  <Toolbar
                    sx={{
                      justifyContent: 'space-between'
                    }}>
                    {/*                     <Box>
                      <IconButton
                        color="inherit"
                        onClick={handleDrawerToggle}
                        sx={{ display: { sm: 'none' } }}>
                        <MenuIcon />
                      </IconButton>
                    </Box> */}
                    <Box
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      justifyContent="space-between"
                      flexGrow={1}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <HomeLogo />

                        <IconButton color="inherit" onClick={() => navigate('/home')}>
                          <Home />
                        </IconButton>

                        <IconButton color="inherit" onClick={() => navigate('/flows')}>
                          <Apps />
                        </IconButton>

                        <IconButton color="inherit" onClick={() => navigate('/requests')}>
                          <Payments />
                        </IconButton>

                        <Box
                          display="flex"
                          flexDirection="row"
                          alignItems="center"
                          component={Button}
                          color="inherit"
                          sx={{
                            width: 100,
                            borderRadius: 5,
                            border: 1,
                            borderColor: 'inherit',
                            textTransform: 'none'
                          }}
                          onClick={async () => {
                            setOpenSearchProfile(true);
                          }}>
                          <Search fontSize="small" />
                          <Typography variant="subtitle2">Search ...</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <IconButton
                          onClick={() =>
                            setAppSettings({ ...appSettings, darkMode: !appSettings.darkMode })
                          }>
                          {appSettings.darkMode ? <DarkModeOutlined /> : <LightModeOutlined />}
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={async (event) => {
                            setProfileMenuAnchorEl(event.currentTarget);
                            setOpenProfileMenu(true);
                          }}>
                          <Avatar src={profile.profileImage} sx={{ width: 36, height: 36 }} />
                        </IconButton>
                      </Stack>
                    </Box>
                  </Toolbar>
                </AppBar>
              </HideOnScroll>

              <Box
                sx={{
                  my: 5,
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'row'
                }}>
                <Outlet />
              </Box>
            </Box>
          </Box>
        )}
        <ProfileMenu
          profile={profile}
          anchorEl={profileMenuAnchorEl}
          open={openProfileMenu}
          onClose={() => setOpenProfileMenu(false)}
          onClick={() => setOpenProfileMenu(false)}
        />
        <SearchProfileDialog
          open={openSearchProfile}
          closeStateCallback={() => {
            setOpenSearchProfile(false);
          }}
        />
      </UserContext.Provider>
    </CustomThemeProvider>
  );
}
