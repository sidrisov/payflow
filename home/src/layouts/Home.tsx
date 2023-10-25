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
            <Button
              variant="outlined"
              color="info"
              size="small"
              href={DOCS_URL}
              sx={{ borderRadius: 5 }}>
              Docs
            </Button>
          </Toolbar>
        </AppBar>
      </HideOnScroll>

      <Box
        mt={-10}
        position="fixed"
        display="flex"
        alignItems="center"
        boxSizing="border-box"
        justifyContent="center"
        sx={{ inset: 0 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Stack direction="column" alignItems="center" spacing={1}>
            <Box display="flex" flexWrap="wrap" justifyContent="center">
              <Typography variant={isMobile ? 'h3' : 'h2'} color={blue[500]} fontWeight="bold">
                Web3 payments
              </Typography>
              <Typography variant={isMobile ? 'h3' : 'h2'} color={blue[500]} fontWeight="bold">
                &nbsp;for&nbsp;
              </Typography>
              <Typography
                variant={isMobile ? 'h3' : 'h2'}
                color={orange[300]}
                fontStyle="italic"
                fontWeight="bold">
                EVERYONE
              </Typography>
            </Box>
            <Typography variant="overline" color={grey[500]} fontWeight="bold">
              Any flow | Gasless | Non-custodial
            </Typography>
          </Stack>
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            sx={{
              mt: 10,
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
              href={`${DAPP_URL}/connect?username=${profile ?? ''}`}
              sx={{ ml: 1, borderRadius: 4 }}>
              START 🚀
            </Button>
          </Box>
        </Box>
      </Box>
      <Box
        p={2}
        width="100%"
        position="fixed"
        bottom={0}
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between">
        <Typography variant="caption">© payflow.me</Typography>
        <IconButton size="small" href="https://x.com/payflowme">
          <Twitter fontSize="small" />
        </IconButton>
      </Box>
    </CustomThemeProvider>
  );
}
