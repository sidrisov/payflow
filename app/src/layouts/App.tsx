import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import {
  AppBar,
  IconButton,
  Toolbar,
  Box,
  Stack,
  Button,
  useTheme,
  useMediaQuery,
  Container,
  Paper,
  BottomNavigation,
  BottomNavigationAction
} from '@mui/material';

import { RiApps2Fill, RiApps2Line } from 'react-icons/ri';

import { ProfileContext } from '../contexts/UserContext';
import HideOnScroll from '../components/HideOnScroll';

import { ProfileType } from '../types/ProfileType';
import { AppSettings } from '../types/AppSettingsType';
import { ProfileMenu } from '../components/menu/ProfileMenu';
import SearchIdentityDialog from '../components/dialogs/SearchIdentityDialog';
import HomeLogo from '../components/Logo';
import ProfileAvatar from '../components/avatars/ProfileAvatar';
import PrimaryFlowOnboardingDialog from '../components/dialogs/PrimaryFlowOnboardingDialog';
import { DAPP_URL } from '../utils/urlConstants';
import { useTokenPrices } from '../utils/queries/prices';
import { IoHomeOutline, IoHomeSharp, IoSearch, IoSearchOutline } from 'react-icons/io5';
import { PiPersonSimpleTaiChi, PiPersonSimpleTaiChiBold } from 'react-icons/pi';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

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
      case '/useful':
        return 2;
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

  return (
    <ProfileContext.Provider
      value={{
        isAuthenticated: authorized,
        profile,
        appSettings,
        setAppSettings
      }}>
      <Container maxWidth="xs">
        <Box display="flex" flexDirection="column" justifyContent="flex-start">
          <HideOnScroll>
            <AppBar position="sticky" color="transparent" elevation={0}>
              {showToolbar && (
                <Toolbar sx={{ padding: 0 }}>
                  <Box
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    flexGrow={1}>
                    <HomeLogo />
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
              )}
            </AppBar>
          </HideOnScroll>
          <Box display="flex" mt={3} pb={8}>
            <Outlet />
          </Box>
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
              zIndex: 1500
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
                '& .MuiBottomNavigationAction-root.Mui-selected': {
                  color: 'inherit',
                  fontWeight: '500'
                },
                '& .MuiBottomNavigationAction-label': {
                  fontSize: 14
                }
              }}>
              <BottomNavigationAction
                disableRipple
                label="Home"
                icon={
                  bottonToolbarActionValue === 0 ? (
                    <IoHomeSharp size={20} />
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
                    <IoSearch size={20} />
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
                label="Useful"
                icon={
                  bottonToolbarActionValue === 2 ? (
                    <PiPersonSimpleTaiChiBold size={20} />
                  ) : (
                    <PiPersonSimpleTaiChi size={20} />
                  )
                }
                onClick={async () => {
                  navigate('/useful');
                  setOpenSearchIdentity(false);
                }}
              />

              <BottomNavigationAction
                disableRipple
                label="Actions"
                icon={
                  bottonToolbarActionValue === 3 ? (
                    <RiApps2Fill size={20} />
                  ) : (
                    <RiApps2Line size={20} />
                  )
                }
                onClick={async () => {
                  navigate('/actions');
                  setOpenSearchIdentity(false);
                }}
              />
            </BottomNavigation>
          </Box>
        )}
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
      {openSearchIdentity && (
        <SearchIdentityDialog
          showOnTopOfNavigation={false}
          hideBackButton
          address={profile?.identity}
          profileRedirect={true}
          open={openSearchIdentity}
          closeStateCallback={() => {
            setOpenSearchIdentity(false);
            setBottonToolbarActionValue(0);
          }}
        />
      )}
      {!location.pathname.startsWith('/payment/') && profile && !profile.defaultFlow && (
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
