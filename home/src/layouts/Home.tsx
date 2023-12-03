import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';

import CustomThemeProvider from '../theme/CustomThemeProvider';
import HideOnScroll from '../components/HideOnScroll';
import Logo from '../components/Logo';
import { blue, grey, orange } from '@mui/material/colors';
import { useState } from 'react';
import { Twitter } from '@mui/icons-material';

const DAPP_URL = import.meta.env.VITE_PAYFLOW_SERVICE_DAPP_URL;
const DOCS_URL = import.meta.env.VITE_PAYFLOW_SERVICE_DOCS_URL;

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [profile, setProfile] = useState<string>();

  return (
    <CustomThemeProvider darkMode={true}>
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
              <IconButton size="small" href="https://x.com/payflowme">
                <Twitter fontSize="small" />
              </IconButton>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                href={DOCS_URL}
                sx={{ borderRadius: 5 }}>
                Docs
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Box my={10} display="flex" alignItems="center" justifyContent="center">
        <Box display="flex" flexDirection="column" alignItems="center">
          <Stack direction="column" alignItems="center" spacing={1}>
            <Typography
              textAlign="center"
              variant={isMobile ? 'h3' : 'h2'}
              color={blue[500]}
              fontWeight="bold"
              fontFamily="monospace">
              Abstract web3 identity payments
            </Typography>
            <Box display="flex" flexWrap="wrap" justifyContent="center">
              <Typography
                variant={isMobile ? 'h3' : 'h2'}
                color={blue[500]}
                fontWeight="bold"
                fontFamily="monospace">
                &nbsp;with&nbsp;
              </Typography>
              <Typography
                variant={isMobile ? 'h3' : 'h2'}
                color={orange[300]}
                fontStyle="italic"
                fontWeight="bold"
                fontFamily="monospace">
                payflow
              </Typography>
            </Box>

            <Typography
              variant="overline"
              color={grey[500]}
              fontWeight="bold"
              fontFamily="monospace">
              FARCASTER | LENS | ENS
            </Typography>
          </Stack>
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            sx={{
              mt: 8,
              px: 1,
              border: 2,
              borderRadius: 5,
              borderStyle: 'dashed',
              borderColor: grey[500]
            }}>
            <Typography fontSize={18} fontWeight="bold">
              payflow.me/
            </Typography>
            <TextField
              size="small"
              variant="standard"
              margin="dense"
              InputProps={{
                inputProps: { maxLength: 16 },
                placeholder: 'yourname',
                sx: { fontSize: 20, width: 90 },
                disableUnderline: true
              }}
              onChange={(event) => {
                setProfile(event.target.value);
              }}
            />
            <Button
              variant="contained"
              color="info"
              href={`${DAPP_URL}/connect${profile ? `?username=${profile}` : ''}`}
              sx={{ ml: 1, borderRadius: 4 }}>
              START 🚀
            </Button>
          </Box>

          <Box mt={10} display="flex" flexDirection="column" alignItems="center">
            <Typography fontSize={30} fontFamily="monospace">
              Powered By
            </Typography>
            <Box
              mt={1}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="flex-start">
              <Stack direction="row" spacing={1} maxWidth={isMobile ? 300 : 600} overflow="scroll">
                <Box p={1} sx={{ borderRadius: 5, border: 1 }}>
                  <img width={isMobile ? 50 : 150} height={isMobile ? 20 : 40} src="safe.svg" />
                </Box>
                <Box p={1} sx={{ background: 'inherit', borderRadius: 5, border: 1 }}>
                  <img width={isMobile ? 50 : 150} height={isMobile ? 20 : 40} src="gelato.svg" />
                </Box>
                <Box p={1} sx={{ background: 'inherit', borderRadius: 5, border: 1 }}>
                  <img width={isMobile ? 50 : 150} height={isMobile ? 20 : 40} src="airstack.svg" />
                </Box>
              </Stack>
              <Box
                mt={2}
                p={1}
                sx={{
                  background: 'white',
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
          </Box>
        </Box>
      </Box>
    </CustomThemeProvider>
  );
}
