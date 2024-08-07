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
  useMediaQuery,
  Container
} from '@mui/material';

import { Home, HomeOutlined } from '@mui/icons-material';

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
  const [authorized, setAuthorized] = useState<boolean>(false);

  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openSearchIdentity, setOpenSearchIdentity] = useState(false);

  const { isLoading, isFetched, data: prices } = useTokenPrices();
  console.log('prices: ', isLoading, isFetched, prices);

  const showToolbar = location.pathname !== '/composer';

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
        <Box height="100vh" display="flex" flexDirection="column" justifyContent="flex-start">
          <HideOnScroll>
            <AppBar
              position="sticky"
              color="transparent"
              elevation={0}
              sx={{ backdropFilter: 'blur(5px)' }}>
              {showToolbar && (
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
                          color={location.pathname === '/' ? 'inherit' : undefined}
                          onClick={() => navigate('/')}>
                          {location.pathname === '/' ? <Home /> : <HomeOutlined />}
                        </IconButton>
                      )}
                      <HomeLogo />
                    </Stack>
                    {location.pathname !== '/search' && (
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
                        <Avatar src="/payflow.png" sx={{ width: 24, height: 24 }} />
                        <Typography variant="subtitle2">Search ... </Typography>
                      </Box>
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
              )}
            </AppBar>
          </HideOnScroll>
          <Box display="flex" mt={3}>
            <Outlet />
          </Box>
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
      {openSearchIdentity && (
        <SearchIdentityDialog
          address={profile?.identity}
          profileRedirect={true}
          open={openSearchIdentity}
          closeStateCallback={() => {
            setOpenSearchIdentity(false);
          }}
        />
      )}
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
