import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useLoaderData } from 'react-router';

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
import { useTokenPrices } from '../utils/queries/prices';
import { IoHomeOutline, IoHomeSharp } from 'react-icons/io5';

import { UpdateVersionPrompt } from '../components/UpdateVersionPrompt';

import PullToRefresh from 'react-simple-pull-to-refresh';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useMobile, usePwa } from '../utils/hooks/useMobile';

import { isIOS } from 'react-device-detect';

import FrameV2SDK from '@farcaster/frame-sdk';
import { usePimlicoInit } from '../utils/hooks/usePimlicoInit';
import { GrStorage } from 'react-icons/gr';

export default function App() {
  const location = useLocation();
  const isMobile = useMobile();
  const navigate = useNavigate();
  const { profile } = useLoaderData<{ profile: ProfileType | undefined }>();

  const [isFrameV2, setIsFrameV2] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState<{ top: number; bottom: number }>();

  usePimlicoInit();

  useEffect(() => {
    const initiateFrameV2 = async () => {
      const context = await FrameV2SDK.context;

      if (context) {
        FrameV2SDK.actions.ready();

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
        setSafeAreaInsets(context.client.safeAreaInsets);
      }
    };

    if (FrameV2SDK && !isFrameV2) {
      initiateFrameV2();
    }
  }, [isFrameV2]);

  const enablePullToRefresh = usePwa() || isFrameV2;

  const bottomToolbarEnabled = !location.pathname.startsWith('/payment');

  const defaultToolbarAction = (() => {
    switch (location.pathname) {
      case '/~/farcaster/storage':
        return 1;
      case `/${profile?.username}`:
        return profile ? 2 : 1;
      default:
        return 0;
    }
  })();

  const [bottonToolbarActionValue, setBottonToolbarActionValue] = useState(defaultToolbarAction);

  const [authorized, setAuthorized] = useState<boolean>(false);

  const [openProfileMenu, setOpenProfileMenu] = useState(false);

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
  return (
    <ProfileContext.Provider
      value={{
        isAuthenticated: authorized,
        profile,
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
                showLabels={false}
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
                    minWidth: 'auto',
                    flex: 1,
                    maxWidth: 'none',
                    padding: '6px 12px'
                  },
                  '& .MuiBottomNavigationAction-root.Mui-selected': {
                    color: 'inherit',
                    fontWeight: '500',
                    padding: '6px 12px'
                  },
                  '& .MuiBottomNavigationAction-label': {
                    display: 'none !important'
                  },
                  ...(Boolean(isIOS) && {
                    height: 'auto',
                    paddingTop: '8px',
                    paddingBottom: 'calc(env(safe-area-inset-bottom) * 0.65)'
                  }),
                  ...(safeAreaInsets &&
                    safeAreaInsets.bottom !== 0 && {
                      height: 'auto',
                      paddingTop: `${safeAreaInsets.top || 8}px`,
                      paddingBottom: `${safeAreaInsets.bottom}px`
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
                  }}
                />
                <BottomNavigationAction
                  disableRipple
                  label="Storage"
                  icon={<GrStorage size={bottonToolbarActionValue === 1 ? 22 : 20} />}
                  onClick={async () => {
                    navigate('/~/farcaster/storage');
                  }}
                />
                {profile && (
                  <BottomNavigationAction
                    disableRipple
                    label="Profile"
                    icon={<CgProfile size={bottonToolbarActionValue === 2 ? 22 : 20} />}
                    onClick={async () => {
                      setOpenProfileMenu(true);
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
    </ProfileContext.Provider>
  );
}
