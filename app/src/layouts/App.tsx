import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  AppBar,
  IconButton,
  Toolbar,
  Box,
  Button,
  Container,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Typography,
  Stack
} from '@mui/material';

import { RiApps2Fill, RiApps2Line } from 'react-icons/ri';
import { CgProfile } from 'react-icons/cg';

import { ProfileContext } from '../contexts/UserContext';
import HideOnScroll from '../components/HideOnScroll';

import { ProfileType } from '../types/ProfileType';
import { AppSettings } from '../types/AppSettingsType';
import { ProfileMenu } from '../components/menu/ProfileMenu';
import SearchIdentityDialog from '../components/dialogs/SearchIdentityDialog';
import ProfileAvatar from '../components/avatars/ProfileAvatar';
import PayflowBalanceDialog from '../components/dialogs/PayflowBalanceDialog';
import { DAPP_URL } from '../utils/urlConstants';
import { useTokenPrices } from '../utils/queries/prices';
import { IoHomeOutline, IoHomeSharp, IoSearch, IoSearchOutline } from 'react-icons/io5';

import { UpdateVersionPrompt } from '../components/UpdateVersionPrompt';

import PullToRefresh from 'react-simple-pull-to-refresh';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useMobile, usePwa } from '../utils/hooks/useMobile';
import Logo from '../components/Logo';

import { isIOS } from 'react-device-detect';
import { GiTwoCoins } from 'react-icons/gi';
import { TbHandClick } from 'react-icons/tb';
import { green } from '@mui/material/colors';

import FrameV2SDK from '@farcaster/frame-sdk';

export default function AppLayout({
  profile,
  appSettings,
  setAppSettings
}: {
  profile: ProfileType | undefined;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}) {
  const location = useLocation();
  const isMobile = useMobile();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const isMiniApp = (() => {
    const miniParam = searchParams.get('mini');
    if (miniParam !== null) {
      localStorage.setItem('payflow.mini', 'true');
      return true;
    }
    return localStorage.getItem('payflow.mini') === 'true';
  })();

  const [isFrameV2, setIsFrameV2] = useState(false);

  useEffect(() => {
    const initiateFrameV2 = async () => {
      const context = await FrameV2SDK.context;

      if (context) {
        await FrameV2SDK.actions.ready();
        setIsFrameV2(true);
        toast.success(`Frame V2 ready for @${context.user.username}`);
      }
    };
    if (FrameV2SDK && !isFrameV2) {
      initiateFrameV2();
    }
  }, [isFrameV2]);

  const enablePullToRefresh = usePwa() || isMiniApp || isFrameV2;

  const bottomToolbarEnabled =
    location.pathname !== '/composer' &&
    location.pathname !== '/search' &&
    !location.pathname.startsWith('/payment');

  const showToolbar =
    location.pathname !== '/composer' && !location.pathname.startsWith('/payment');

  const defaultToolbarAction = (() => {
    switch (location.pathname) {
      case '/actions':
        return 3;
      case '/earn':
        return 2;
      case `/${profile?.username}`:
        return profile ? 4 : 3;
      default:
        return 0;
    }
  })();

  const [bottonToolbarActionValue, setBottonToolbarActionValue] = useState(defaultToolbarAction);

  const [authorized, setAuthorized] = useState<boolean>(false);

  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openSearchIdentity, setOpenSearchIdentity] = useState(false);

  const { isLoading, isFetched, data: prices } = useTokenPrices();
  console.log('prices: ', isLoading, isFetched, prices);

  useEffect(() => {
    if (profile) {
      if (profile.username) {
        setAuthorized(true);
      } else {
        navigate('/connect');
      }
    }
  }, [profile]);

  const {
    needRefresh: [needRefresh]
  } = useRegisterSW();

  const [showPayflowBalance, setShowPayflowBalance] = useState(false);

  useEffect(() => {
    if (!profile || location.pathname !== '/') {
      return;
    }

    const hasUserDismissed = localStorage.getItem('payflow:balance:prompt:dismissed') === 'true';
    if (
      !hasUserDismissed &&
      !profile.flows?.find((f) => !f.archived && (!f.type || f.type === 'REGULAR'))
    ) {
      toast(
        <Stack spacing={1}>
          <Typography textAlign="start" fontSize={14} fontWeight="bold">
            Payflow Balance
            <Typography variant="caption" display="block" color="text.secondary">
              1-click gasless payments
            </Typography>
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setShowPayflowBalance(true);
                toast.dismiss();
              }}
              color="inherit"
              sx={{
                borderRadius: 3,
                border: 1,
                '&:hover': {
                  backgroundColor: green.A700,
                  borderColor: green.A700,
                  color: 'black'
                }
              }}>
              Create
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                localStorage.setItem('payflow:balance:prompt:dismissed', 'true');
                toast.dismiss();
              }}
              color="inherit"
              sx={{ borderRadius: 3 }}>
              Dismiss
            </Button>
          </Box>
        </Stack>,
        {
          autoClose: false,
          icon: <TbHandClick size={24} />
        }
      );
    }
  }, [location.pathname, profile]);

  // specify container height,
  // otherwise privy will have an issue displaying the dialog content
  return (
    <ProfileContext.Provider
      value={{
        isAuthenticated: authorized,
        profile,
        isMiniApp,
        isFrameV2,
        appSettings,
        setAppSettings
      }}>
      <PullToRefresh
        isPullable={enablePullToRefresh}
        onRefresh={async () => {
          navigate(0);
        }}>
        <Container
          maxWidth="xs"
          sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
          <HideOnScroll>
            <AppBar position="sticky" color="transparent" elevation={0}>
              {needRefresh && <UpdateVersionPrompt />}
              {showToolbar && (
                <Toolbar sx={{ padding: 0 }}>
                  <Box
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    flexGrow={1}>
                    <Logo p="5px" />
                    {profile ? (
                      <IconButton
                        size="small"
                        onClick={async (event) => {
                          setProfileMenuAnchorEl(event.currentTarget);
                          setOpenProfileMenu(true);
                        }}>
                        <ProfileAvatar
                          profile={profile as ProfileType}
                          sx={{ width: 36, height: 36 }}
                        />
                      </IconButton>
                    ) : (
                      <Button
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
                  </Box>
                </Toolbar>
              )}
            </AppBar>
          </HideOnScroll>
          <Box
            flexGrow={1}
            display="flex"
            flexDirection="column"
            mb={bottomToolbarEnabled ? 7.5 : 0}
            sx={{
              overflowX: 'hidden',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              msOverflowStyle: 'none', // IE and Edge
              scrollbarWidth: 'none' // Firefox
            }}>
            <Outlet />
          </Box>
          {bottomToolbarEnabled && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
                zIndex: 1400
              }}>
              <BottomNavigation
                showLabels
                elevation={10}
                component={Paper}
                value={bottonToolbarActionValue}
                onChange={(_, newValue) => {
                  setBottonToolbarActionValue(newValue);
                }}
                sx={{
                  ...(isMobile
                    ? { width: '100%', borderTopLeftRadius: 25, borderTopRightRadius: 25 }
                    : { maxWidth: 350, mx: 5, mb: 1, borderRadius: 10 }),
                  '& .MuiBottomNavigationAction-root': {
                    minWidth: 'auto'
                  },
                  '& .MuiBottomNavigationAction-root.Mui-selected': {
                    color: 'inherit',
                    fontWeight: '500'
                  },
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: 14
                  },
                  ...(Boolean(isIOS) && {
                    height: 'auto',
                    paddingTop: '8px',
                    paddingBottom: 'calc(env(safe-area-inset-bottom) * 0.65)'
                  })
                }}>
                <BottomNavigationAction
                  disableRipple
                  label="Home"
                  icon={
                    bottonToolbarActionValue === 0 ? (
                      <IoHomeSharp size={22} />
                    ) : (
                      <IoHomeOutline size={20} />
                    )
                  }
                  onClick={async () => {
                    navigate('/');
                    setOpenSearchIdentity(false);
                  }}
                />
                <BottomNavigationAction
                  disableRipple
                  label="Search"
                  icon={
                    bottonToolbarActionValue === 1 ? (
                      <IoSearch size={22} />
                    ) : (
                      <IoSearchOutline size={20} />
                    )
                  }
                  onClick={async () => {
                    navigate('/');
                    setOpenSearchIdentity(true);
                  }}
                />
                <BottomNavigationAction
                  disableRipple
                  label="Earn"
                  icon={
                    bottonToolbarActionValue === 2 ? (
                      <GiTwoCoins size={22} />
                    ) : (
                      <GiTwoCoins size={20} />
                    )
                  }
                  onClick={async () => {
                    navigate('/earn');
                    setOpenSearchIdentity(false);
                  }}
                />
                <BottomNavigationAction
                  disableRipple
                  label="Actions"
                  icon={
                    bottonToolbarActionValue === 3 ? (
                      <RiApps2Fill size={22} />
                    ) : (
                      <RiApps2Line size={20} />
                    )
                  }
                  onClick={async () => {
                    navigate('/actions');
                    setOpenSearchIdentity(false);
                  }}
                />
                {profile && (
                  <BottomNavigationAction
                    disableRipple
                    label="Activity"
                    icon={<CgProfile size={bottonToolbarActionValue === 4 ? 22 : 20} />}
                    onClick={async () => {
                      if (profile.username) {
                        navigate(`/${profile.username}`);
                      }
                      setOpenSearchIdentity(false);
                    }}
                  />
                )}
              </BottomNavigation>
            </Box>
          )}
        </Container>
      </PullToRefresh>

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
      {openSearchIdentity && (
        <SearchIdentityDialog
          // TODO: doesn't work properly on IOS, navigation is hidden
          //showOnTopOfNavigation={false}
          address={profile?.identity}
          profileRedirect={true}
          open={openSearchIdentity}
          closeStateCallback={() => {
            setOpenSearchIdentity(false);
            setBottonToolbarActionValue(0);
          }}
        />
      )}

      {profile && (
        <PayflowBalanceDialog
          open={showPayflowBalance}
          profile={profile}
          closeStateCallback={() => setShowPayflowBalance(false)}
        />
      )}
    </ProfileContext.Provider>
  );
}
