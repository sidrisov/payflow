import { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { AppBar, IconButton, Toolbar, Box, Container, Drawer, Stack } from '@mui/material';

import CustomThemeProvider from '../theme/CustomThemeProvider';
import { LightModeOutlined, DarkModeOutlined, Menu } from '@mui/icons-material';

import Nav from '../components/Navigation';

import { UserContext } from '../contexts/UserContext';
import HideOnScroll from '../components/HideOnScroll';
import { AccountType } from '../types/AccountType';
import { useAccount, useContractRead, useEnsAddress } from 'wagmi';
import axios from 'axios';
import { toast } from 'react-toastify';

import AggregatorV2V3Interface from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/interfaces/AggregatorV2V3Interface.sol/AggregatorV2V3Interface.json';
import { formatUnits } from 'viem';
import { shortenWalletAddressLabel } from '../utils/address';

const drawerWidth = 151;

export default function AppLayout({ authStatus, authAccount, appSettings, setAppSettings }: any) {
  const { isConnected, address } = useAccount();
  const [walletBalances, setWalletBalances] = useState<Map<string, bigint>>(new Map());
  const [accounts, setAccounts] = useState<AccountType[]>();
  const [smartAccountAllowedChains, setSmartAccountAllowedChains] = useState<string[]>([]);
  const [initiateRefresh, setInitiateRefresh] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);

  const [isAuthorized, setAuthorized] = useState<boolean>(false);

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

  useEffect(() => {
    console.log(ethUsdPrice);
  }, [ethUsdPrice]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  async function fetchAccounts() {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/accounts`,
        { withCredentials: true }
      );

      setAccounts(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  useMemo(async () => {
    if (isConnected) {
      if (authStatus === 'authenticated' && authAccount) {
        if (authAccount === address) {
          setAuthorized(true);
          return;
        } else {
          toast.error(
            `Please, logout or switch wallet! Connected wallet is different from verified: ${shortenWalletAddressLabel(
              authAccount
            )}`,
            { autoClose: false }
          );
        }
      }
    }
    setAuthorized(false);
  }, [isConnected, address, authStatus, authAccount]);

  useMemo(async () => {
    if (initiateRefresh && accounts) {
      setInitiateRefresh(false);
      fetchAccounts();
    }
  }, [accounts, initiateRefresh]);

  useMemo(async () => {
    console.log({ isAuthenticated: isAuthorized });
    if (isAuthorized) {
      fetchAccounts();
    }
  }, [isAuthorized]);

  useMemo(async () => {
    if (accounts) {
      setSmartAccountAllowedChains(accounts.map((c) => c.network));
    }
  }, [accounts]);

  const drawer = <Nav />;
  return (
    <CustomThemeProvider darkMode={appSettings.darkMode}>
      <UserContext.Provider
        value={{
          isAuthenticated: isAuthorized,
          appSettings,
          setAppSettings,
          accounts,
          setAccounts,
          smartAccountAllowedChains,
          setSmartAccountAllowedChains,
          setInitiateRefresh,
          walletBalances,
          setWalletBalances,
          ethUsdPrice
        }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-evenly'
          }}>
          <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
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
          </Box>
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
                  <Box>
                    <IconButton
                      color="inherit"
                      onClick={handleDrawerToggle}
                      sx={{ display: { sm: 'none' } }}>
                      <Menu />
                    </IconButton>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      onClick={() =>
                        setAppSettings({ ...appSettings, darkMode: !appSettings.darkMode })
                      }>
                      {appSettings.darkMode ? <DarkModeOutlined /> : <LightModeOutlined />}
                    </IconButton>

                    <ConnectButton
                      showBalance={{ smallScreen: false, largeScreen: true }}
                      chainStatus={{ smallScreen: 'icon', largeScreen: 'full' }}
                    />
                  </Stack>
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
              <Container>
                <Outlet />
              </Container>
            </Box>
          </Box>
        </Box>
      </UserContext.Provider>
    </CustomThemeProvider>
  );
}
