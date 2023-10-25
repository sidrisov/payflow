import {
  AppBar,
  Box,
  Button,
  Card,
  IconButton,
  Paper,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Toolbar,
  Typography
} from '@mui/material';
import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import HideOnScroll from '../components/HideOnScroll';
import { Helmet } from 'react-helmet-async';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import { useAccount } from 'wagmi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import OnboardingDialog from '../components/OnboardingDialog';

const steps = [
  {
    label: 'Connect Wallet',
    description: `For each ad campaign that you create, you can control how much
              you're willing to spend on clicks and conversions, which networks
              and geographical locations you want your ads to show on, and more.`
  },
  {
    label: 'Verification',
    description: 'An ad group contains one or more ads which target a shared set of keywords.'
  },
  {
    label: 'Claim username',
    description: `Try out different ad text to see what brings in the most customers,
              and learn how to enhance your ads using features like ad extensions.
              If you run into any problems with your ads, find out how to tell if
              they're running and how to resolve approval issues.`
  },
  {
    label: 'Set up main flow',
    description: `Try out different ad text to see what brings in the most customers,
              and learn how to enhance your ads using features like ad extensions.
              If you run into any problems with your ads, find out how to tell if
              they're running and how to resolve approval issues.`
  }
];

export default function Login({ authStatus, authAccount, appSettings, setAppSettings }: any) {
  const [searchParams] = useSearchParams();
  const username = searchParams.get('username');

  const [onboarding, setOnboarding] = useState<boolean>(false);

  const navigate = useNavigate();

  const { address } = useAccount();

  useMemo(async () => {
    if (authAccount && address === authAccount.address && authStatus === 'authenticated') {
      const isOnboarded = await isUserOnboarded();
      if (isOnboarded) {
        navigate('/');
      } else {
        setOnboarding(true);
      }
    }
  }, [authStatus, authAccount]);

  async function isUserOnboarded() {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/user/me/onboarded`,
        {
          withCredentials: true
        }
      );
      if (response.status === 200) {
        return response.data;
      }
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function updateUsername() {
    if (username) {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/user/me`,
          username,

          {
            headers: {
              'Content-Type': 'application/text'
            },
            withCredentials: true
          }
        );
        if (response.status === 200) {
          toast.success(`Successfully claimed username: ${username}`);
        }
        console.log(response.status);
      } catch (error) {
        console.log(error);
      }
    }
  }

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
            <Typography variant="h6">{username}</Typography>
            <Typography alignSelf="flex-start" variant="subtitle2">
              Wallet Connected: {address ? 'Yes' : 'No'}
            </Typography>
            <Typography alignSelf="flex-start" variant="subtitle2">
              Authenticated:{' '}
              {authAccount && address === authAccount.address && authStatus === 'authenticated'
                ? 'Yes'
                : 'No'}
            </Typography>
            <ConnectButton
              label={address ? 'Verify' : 'Connect'}
              showBalance={{ smallScreen: false, largeScreen: false }}
            />
          </Box>
        </Card>
      </Box>
      <OnboardingDialog
        open={onboarding}
        closeStateCallback={() => {
          setOnboarding(false);
        }}
        username={username ?? ''}
      />
    </CustomThemeProvider>
  );
}
