import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  useMediaQuery,
  useTheme,
  Avatar,
  Badge
} from '@mui/material';

import CustomThemeProvider from '../theme/CustomThemeProvider';
import HideOnScroll from '../components/HideOnScroll';
import Logo from '../components/Logo';
import { green, grey } from '@mui/material/colors';
import { useState } from 'react';

const DAPP_URL = import.meta.env.VITE_PAYFLOW_SERVICE_DAPP_URL;
const DOCS_URL = import.meta.env.VITE_PAYFLOW_SERVICE_DOCS_URL;

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [profile, setProfile] = useState<string>();

  return (
    <CustomThemeProvider darkMode={false}>
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
            <Logo />
            <Box>
              {/* <IconButton size="small" href="https://x.com/payflowme">
                <Twitter fontSize="small" />
              </IconButton> */}
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                href={`${DAPP_URL}/connect`}
                sx={{ borderRadius: 5, fontWeight: 'bold' }}>
                Sign In
              </Button>
              {/*  <Button
                variant="outlined"
                color="inherit"
                size="small"
                href={DOCS_URL}
                sx={{ borderRadius: 5 }}>
                Docs
              </Button> */}
            </Box>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Box my={isMobile ? 10 : 5} display="flex" alignItems="center" justifyContent="center">
        <Box display="flex" flexDirection="column" alignItems="center">
          <Stack direction="column" alignItems="center" spacing={1}>
            <Badge
              badgeContent={
                <Typography
                  variant={isMobile ? 'h5' : 'h4'}
                  fontWeight="bold"
                  color={green.A700}
                  sx={{ mb: 3, ml: isMobile ? -25 : 0 }}>
                  made easy
                </Typography>
              }>
              <Typography textAlign="center" variant={isMobile ? 'h4' : 'h2'} fontWeight="bold">
                Onchain Social Payments
              </Typography>
            </Badge>

            <Typography
              fontSize={isMobile ? 18 : 24}
              fontWeight="bold"
              color={green.A700}
              textAlign="center">
              abstracted | gasless | non-custodial
            </Typography>

            <Stack spacing={1} direction="row" alignItems="center">
              <Stack spacing={1} direction="row" alignItems="center">
                <Avatar variant="rounded" src="farcaster.svg" sx={{ width: 20, height: 20 }} />
                <Typography color={grey[500]} fontSize={15} fontWeight="bold">
                  farcaster
                </Typography>
              </Stack>
              <Typography>|</Typography>
              <Stack spacing={1} direction="row" alignItems="center">
                <Avatar variant="rounded" src="lens.svg" sx={{ width: 20, height: 20 }} />
                <Typography color={grey[500]} fontSize={15} fontWeight="bold">
                  lens
                </Typography>
              </Stack>
              <Typography>|</Typography>
              <Stack spacing={1} direction="row" alignItems="center">
                <Avatar variant="rounded" src="ens.svg" sx={{ width: 20, height: 20 }} />
                <Typography color={grey[500]} fontSize={15} fontWeight="bold">
                  ens
                </Typography>
              </Stack>
            </Stack>

            <Box p={2} sx={{ borderRadius: 10, border: 1, backgroundColor: '#191919' }}>
              <img
                width={isMobile ? 300 : 600}
                height={isMobile ? 215 : 430}
                src="payflow_ux.png"
              />
            </Box>
          </Stack>

          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            sx={{
              mt: 3,
              mx: 1,
              border: 2,
              borderRadius: 10,
              borderStyle: 'dashed',
              borderColor: grey[500]
            }}>
            <Avatar src="payflow.png" sx={{ ml: 1, width: 36, height: 36 }} />
            <Typography fontSize={isMobile ? 16 : 18} fontWeight="bold">
              payflow.me/
            </Typography>
            <TextField
              size="small"
              variant="standard"
              margin="dense"
              InputProps={{
                inputProps: { maxLength: 16 },
                placeholder: 'yourname',
                sx: { fontSize: isMobile ? 18 : 20, width: 90 },
                disableUnderline: true
              }}
              onChange={(event) => {
                setProfile(event.target.value);
              }}
            />
            <Button
              size="medium"
              variant="contained"
              href={`${DAPP_URL}/connect${profile ? `?username=${profile}` : ''}`}
              sx={{
                m: 1,
                borderRadius: 5,
                bgcolor: 'black',
                '&:hover': { bgcolor: green.A700 }
              }}>
              JOIN 🚀
            </Button>
          </Box>

          {/* <Box mt={10} display="flex" flexDirection="column" alignItems="center">
            <Typography fontSize={30} fontFamily="monospace">
              Powered By
            </Typography>
            <Box
              mt={1}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="flex-start">
              <Stack direction="row" spacing={1} maxWidth={isMobile ? 300 : 600} overflow="auto">
                <Box
                  p={1}
                  sx={{ color: 'black', borderRadius: 5, border: 1 }}
                  style={{ fill: 'green' }}>
                  <img width={isMobile ? 50 : 150} height={isMobile ? 20 : 40} src="safe.svg" />
                </Box>
                <Box p={1} sx={{ borderRadius: 5, border: 1 }}>
                  <img width={isMobile ? 50 : 150} height={isMobile ? 20 : 40} src="gelato.svg" />
                </Box>
                <Box p={1} sx={{ borderRadius: 5, border: 1 }}>
                  <img width={isMobile ? 50 : 150} height={isMobile ? 20 : 40} src="airstack.svg" />
                </Box>
              </Stack>
              <Box
                mt={2}
                p={1}
                sx={{
                  borderRadius: 5,
                  border: 1
                }}>
                <img
                  width={isMobile ? 100 : 200}
                  height={isMobile ? 20 : 40}
                  src="gcp_for_startups.png"
                />
              </Box>
            </Box>
          </Box> */}
        </Box>
      </Box>
    </CustomThemeProvider>
  );
}
