import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'react-toastify';

import {
  AppBar,
  Box,
  Container,
  Paper,
  BottomNavigation,
  BottomNavigationAction
} from '@mui/material';

import { CgProfile } from 'react-icons/cg';

import { ProfileContext } from '../contexts/UserContext';

import { ProfileType } from '@payflow/common';
import { ProfileMenu } from '../components/menu/ProfileMenu';
import SearchIdentityDialog from '../components/dialogs/SearchIdentityDialog';
import { useTokenPrices } from '../utils/queries/prices';
import { IoHomeOutline, IoHomeSharp } from 'react-icons/io5';

import { UpdateVersionPrompt } from '../components/UpdateVersionPrompt';

import PullToRefresh from 'react-simple-pull-to-refresh';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useMobile, usePwa } from '../utils/hooks/useMobile';

import { isIOS } from 'react-device-detect';

import FrameV2SDK from '@farcaster/frame-sdk';
import axios from 'axios';
import { me } from '../services/user';
import sortAndFilterFlows from '../utils/sortAndFilterFlows';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';
import { usePimlicoInit } from '../utils/hooks/usePimlicoInit';
import { MdContacts } from 'react-icons/md';
import { SiLightning } from 'react-icons/si';

export default function App() {
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
  const [safeAreaInsets, setSafeAreaInsets] = useState<{ top: string; bottom: string }>();

  const fetchingStatusRef = useRef(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<ProfileType>();

  const accessToken = useSearchParams()[0].get('access_token') ?? undefined;

  // Fetch user when:
  useEffect(() => {
    const fetchStatus = async () => {
      if (fetchingStatusRef.current) {
        return;
      }

      fetchingStatusRef.current = true;
      try {
        const profile = await me(accessToken);
        if (profile) {
          if (profile.flows) {
            profile.flows = sortAndFilterFlows(profile.flows);
          }
          setProfile(profile);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(`🤷🏻‍♂️ ${error.message}`);
        }
        console.error(error);
      } finally {
        setLoading(false);
        fetchingStatusRef.current = false;
      }
    };

    // 1. page loads
    fetchStatus();

    // 2. window is focused (in case user logs out of another window)
    window.addEventListener('focus', fetchStatus);
    return () => window.removeEventListener('focus', fetchStatus);
  }, []);

  usePimlicoInit();

  useEffect(() => {
    const initiateFrameV2 = async () => {
      const context = await FrameV2SDK.context;

      if (context) {
        FrameV2SDK.actions.ready();
        if (context.client.safeAreaInsets) {
          setSafeAreaInsets({
            top: `${context.client.safeAreaInsets.top}px`,
            bottom: `${context.client.safeAreaInsets.bottom}px`
          });
        }

        if (!context.client.added) {
          const lastChecked = localStorage.getItem('payflow:frame:checked');
          const shouldCheck =
            !lastChecked || Date.now() - parseInt(lastChecked) > 7 * 24 * 60 * 60 * 1000;

          if (shouldCheck) {
            await FrameV2SDK.actions.addFrame();
            localStorage.setItem('payflow:frame:checked', Date.now().toString());
          }
        }
        setIsFrameV2(true);
      }
    };

    if (FrameV2SDK && !isFrameV2 && !loading) {
      initiateFrameV2();
    }
  }, [isFrameV2, loading]);

  const enablePullToRefresh = usePwa() || isMiniApp || isFrameV2;

  const bottomToolbarEnabled =
    location.pathname !== '/composer' &&
    location.pathname !== '/contacts' &&
    !location.pathname.startsWith('/payment');

  const defaultToolbarAction = (() => {
    switch (location.pathname) {
      case '/services':
        return 2;
      case `/${profile?.username}`:
        return profile ? 3 : 2;
      default:
        return 0;
    }
  })();

  const [bottonToolbarActionValue, setBottonToolbarActionValue] = useState(defaultToolbarAction);

  const [authorized, setAuthorized] = useState<boolean>(false);

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

  // specify container height,
  // otherwise privy will have an issue displaying the dialog content
  return loading ? (
    <LoadingPayflowEntryLogo />
  ) : (
    <ProfileContext.Provider
      value={{
        isAuthenticated: authorized,
        profile,
        isMiniApp,
        isFrameV2
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
          <AppBar position="sticky" color="transparent" elevation={0}>
            {needRefresh && <UpdateVersionPrompt />}
          </AppBar>
          <Box
            display="flex"
            flexDirection="column"
            mt={2}
            mb={bottomToolbarEnabled ? (isMobile ? 6 : 7) : 0}
            sx={{
              overflowX: 'hidden',
              overflowY: 'scroll'
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
                    ? { width: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                    : { minWidth: 350, mb: 1 }),
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
                  }),
                  ...(safeAreaInsets && {
                    height: 'auto',
                    paddingTop: safeAreaInsets.top,
                    paddingBottom: safeAreaInsets.bottom
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
                  label="Contacts"
                  icon={
                    bottonToolbarActionValue === 1 ? (
                      <MdContacts size={22} />
                    ) : (
                      <MdContacts size={20} />
                    )
                  }
                  onClick={async () => {
                    navigate('/');
                    setOpenSearchIdentity(true);
                  }}
                />
                <BottomNavigationAction
                  disableRipple
                  label="Services"
                  icon={
                    bottonToolbarActionValue === 2 ? (
                      <SiLightning size={22} />
                    ) : (
                      <SiLightning size={20} />
                    )
                  }
                  onClick={async () => {
                    navigate('/services');
                    setOpenSearchIdentity(false);
                  }}
                />
                {profile && (
                  <BottomNavigationAction
                    disableRipple
                    label="Profile"
                    icon={<CgProfile size={bottonToolbarActionValue === 4 ? 22 : 20} />}
                    onClick={async () => {
                      setOpenProfileMenu(true);
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
          open={openProfileMenu}
          onClose={() => {
            setOpenProfileMenu(false);
          }}
          closeStateCallback={() => {
            setOpenProfileMenu(false);
            setBottonToolbarActionValue(0);
          }}
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
    </ProfileContext.Provider>
  );
}
