import { useEffect, useMemo, useState } from 'react';
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
  useMediaQuery,
  Container
} from '@mui/material';

import { Home, HomeOutlined } from '@mui/icons-material';

import { ProfileContext } from '../contexts/UserContext';
import HideOnScroll from '../components/HideOnScroll';
import { useEnsAddress, useReadContract } from 'wagmi';

import AggregatorV2V3Interface from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/interfaces/AggregatorV2V3Interface.sol/AggregatorV2V3Interface.json';
import { formatUnits } from 'viem';
import { ProfileType } from '../types/ProfleType';
import { AppSettings } from '../types/AppSettingsType';
import { ProfileMenu } from '../components/menu/ProfileMenu';
import SearchIdentityDialog from '../components/dialogs/SearchIdentityDialog';
import HomeLogo from '../components/Logo';
import ProfileAvatar from '../components/avatars/ProfileAvatar';
import PrimaryFlowOnboardingDialog from '../components/dialogs/PrimaryFlowOnboardingDialog';
import axios from 'axios';
import { DEGEN_TOKEN, ETH_TOKEN, TokenPrices, USDC_TOKEN } from '../utils/erc20contracts';
import { DAPP_URL } from '../utils/urlConstants';
import { WalletProviderType } from '../utils/providers';

export default function AppLayout({
  profile,
  appSettings,
  setAppSettings,
  walletProvider
}: {
  profile: ProfileType | undefined;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  walletProvider: WalletProviderType;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();

  const [authorized, setAuthorized] = useState<boolean>(false);

  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openSearchIdentity, setOpenSearchIdentity] = useState(false);

  const location = useLocation();

  const [tokenPrices, setTokenPrices] = useState<TokenPrices>();

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

  // TODO: create hook for fetching prices
  useMemo(async () => {
    if (ethUsdPrice) {
      // TODO: replace with more known price source
      const response = await axios.get(
        'https://api.dexscreener.com/latest/dex/pairs/base/0xc9034c3E7F58003E6ae0C8438e7c8f4598d5ACAA'
      );

      const tokenPrices = {
        [ETH_TOKEN]: ethUsdPrice,
        [USDC_TOKEN]: 1,
        [DEGEN_TOKEN]: response.data.pair.priceUsd
      } as TokenPrices;

      setTokenPrices(tokenPrices);
    }
  }, [ethUsdPrice]);

  useEffect(() => {
    if (profile) {
      if (profile.username) {
        setAuthorized(true);
      } else {
        navigate('/connect');
      }
    }
  }, [profile]);

  /* const { setActiveWallet } = useSetActiveWallet();
  const { wallets, ready } = useWallets();
  const { user } = usePrivy();
  const { status, address } = useAccount();

  useEffect(() => {
    console.log(
      'Available wallets (privy), ready, user, account: ',
      wallets,
      ready,
      user,
      status,
      address
    );

    if (ready && wallets.length !== 0) {
      const wallet = wallets[0]; //wallets.find((w) => w.walletClientType === 'privy') ?? wallets[0];
      console.log('Setting active wallet: ', wallet);
      setActiveWallet(wallet);
    }
  }, [wallets, ready, status, address]); */

  return (
    <ProfileContext.Provider
      value={{
        isAuthenticated: authorized,
        profile,
        appSettings,
        setAppSettings,
        tokenPrices,
        walletProvider
      }}>
      <Container maxWidth="xs">
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
                  <Stack direction="row" alignItems="center">
                    {profile && (
                      <IconButton
                        color={location.pathname === '/home' ? 'inherit' : undefined}
                        onClick={() => navigate('/home')}>
                        {location.pathname === '/home' ? <Home /> : <HomeOutlined />}
                      </IconButton>
                    )}
                    <HomeLogo />
                  </Stack>
                  {location.pathname !== '/search' && (
                    <Stack direction="row" alignItems="center">
                      {/*                   <IconButton
                    color={location.pathname === '/flows' ? 'inherit' : undefined}
                    onClick={() => comingSoonToast()}>
                    <AppsOutlined />
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
                  )}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {profile ? (
                      <IconButton
                        size="small"
                        onClick={async (event) => {
                          setProfileMenuAnchorEl(event.currentTarget);
                          setOpenProfileMenu(true);
                        }}>
                        <ProfileAvatar profile={profile} sx={{ width: 36, height: 36 }} />
                      </IconButton>
                    ) : (
                      <Button
                        variant="text"
                        color="inherit"
                        size="medium"
                        href={`${DAPP_URL}/connect`}
                        sx={{
                          borderRadius: 5,
                          fontWeight: 'bold',
                          fontSize: 18,
                          textTransform: 'none'
                        }}>
                        sign in
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Toolbar>
            </AppBar>
          </HideOnScroll>
          <Box display="flex" mt={3}>
            <Outlet />
          </Box>
          {/* <Paper sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: grey[100] }}>
            <BottomNavigation
              onChange={(_, value) => {
                switch (value) {
                  case 0:
                    navigate('/');
                    break;
                  case 1:
                    setOpenSearchIdentity(true);
                    break;
                  case 2:
                    navigate(`/${profile?.username}`);
                }
              }}>
              <BottomNavigationAction
                icon={location.pathname === '/home' ? <Home color="inherit" /> : <HomeOutlined />}
              />
              <BottomNavigationAction icon={<Search />} />
              <BottomNavigationAction
                icon={
                  location.pathname === `/${profile?.username}` ? (
                    <Person color="inherit" />
                  ) : (
                    <PersonOutline />
                  )
                }
              />
            </BottomNavigation>
          </Paper> */}
        </Box>
      </Container>

      {profile && (
        <ProfileMenu
          profile={profile}
          loginRedirectOnLogout={false}
          anchorEl={profileMenuAnchorEl}
          open={openProfileMenu}
          onClose={() => setOpenProfileMenu(false)}
          closeStateCallback={() => setOpenProfileMenu(false)}
        />
      )}
      <SearchIdentityDialog
        address={profile?.identity}
        profileRedirect={true}
        open={openSearchIdentity}
        closeStateCallback={() => {
          setOpenSearchIdentity(false);
        }}
      />
      {profile && !profile.defaultFlow && (
        <PrimaryFlowOnboardingDialog
          fullScreen={isMobile}
          open={!profile.defaultFlow}
          profile={profile}
          closeStateCallback={() => {}}
        />
      )}
    </ProfileContext.Provider>
  );
}
