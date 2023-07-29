import '@rainbow-me/rainbowkit/styles.css';
import 'react-toastify/dist/ReactToastify.css';

import {
  AppBar,
  Box,
  Card,
  IconButton,
  Stack,
  Toolbar,
  Typography
} from '@mui/material';
import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import HideOnScroll from '../components/HideOnScroll';
import { Helmet } from 'react-helmet-async';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import { useAccount } from 'wagmi';

export default function Login({ authStatus, appSettings, setAppSettings }: any) {
  const { address } = useAccount();

  return (
    <CustomThemeProvider darkMode={appSettings.darkMode}>
      <Helmet>
        <title> PayFlow | Login </title>
      </Helmet>
      <HideOnScroll>
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{ alignItems: 'flex-end', backdropFilter: 'blur(5px)' }}>
          <Toolbar
            sx={{
              justifyContent: 'space-between'
            }}>
            <Stack direction="row" spacing={1}>
              <IconButton
                onClick={() => setAppSettings({ ...appSettings, darkMode: !appSettings.darkMode })}>
                {appSettings.darkMode ? <DarkModeOutlined /> : <LightModeOutlined />}
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Box
        position="fixed"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ inset: 0 }}>
        <Card
          elevation={15}
          sx={{
            p: 5,
            width: 300,
            height: 250,
            border: 2,
            borderStyle: 'double',
            borderRadius: 5,
            borderColor: 'divider'
          }}>
          <Box
            height="100%"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            alignItems="center">
            <Typography variant="h6">Welcome To PayFlow</Typography>
            <Typography alignSelf="flex-start" variant="subtitle2">
              Wallet Connected: {address ? 'Yes' : 'No'}
            </Typography>
            <Typography alignSelf="flex-start" variant="subtitle2">
              Authenticated: {authStatus === 'authenticated' ? 'Yes' : 'No'}
            </Typography>
            <ConnectButton showBalance={{ smallScreen: false, largeScreen: false }} />
          </Box>
        </Card>
      </Box>
    </CustomThemeProvider>
  );
}
