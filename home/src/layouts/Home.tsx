import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  Container,
  useMediaQuery,
  IconButton
} from '@mui/material';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import Logo from '../components/Logo';
import { green } from '@mui/material/colors';
import { ArrowForward, Help } from '@mui/icons-material';
import { SiFarcaster } from 'react-icons/si';
import { FaXTwitter } from 'react-icons/fa6';
import { MdRocketLaunch } from 'react-icons/md';

const DAPP_URL = import.meta.env.VITE_PAYFLOW_SERVICE_DAPP_URL;

const farcasterPurple = '#8A63D2';

export default function Home() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  return (
    <CustomThemeProvider darkMode={prefersDarkMode}>
      <AppBar position="sticky" color="transparent" elevation={0}>
        <Toolbar
          sx={{
            justifyContent: 'space-between'
          }}>
          <Logo />
          <Box>
            <IconButton
              color="inherit"
              size="small"
              href="https://warpcast.com/~/channel/payflow"
              target="_blank">
              <SiFarcaster size="20" />
            </IconButton>
            <IconButton color="inherit" size="small" href="https://x.com/payflowme" target="_blank">
              <FaXTwitter size={20} />
            </IconButton>
            <Button
              startIcon={<Help />}
              variant="text"
              color="inherit"
              size="medium"
              href="https://payflowlabs.notion.site/Payflow-FAQs-20593cf7734e4d78ad0dc91c8e8982e5"
              target="_blank"
              sx={{ borderRadius: 5, fontSize: 15, fontWeight: 'bold' }}>
              FAQ
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Container
        maxWidth="lg"
        sx={{
          height: 'calc(100vh - 100px)',
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column'
        }}>
        <Typography
          mt={2}
          variant="h2"
          fontWeight="bold"
          textAlign="center"
          sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}>
          Onchain Social Payments
        </Typography>
        <Typography
          variant="h6"
          fontWeight="bold"
          textAlign="center"
          color={green.A700}
          sx={{
            fontSize: { xs: '1.2rem', sm: '1.5rem' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}>
          Connect
          <ArrowForward fontSize="small" />
          Earn
          <ArrowForward fontSize="small" />
          Pay
        </Typography>

        <Box
          mt={1}
          sx={{
            position: 'relative',
            height: 'calc(100vh - 350px)',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
          }}>
          {['payflow_ux.png', 'payflow_ux_contacts.png'].map((src, index) => (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: index === 0 ? 2 : 1,
                left: '50%',
                transform: 'translateX(-60%)'
              }}>
              <Box
                component="img"
                src={src}
                alt={`Payflow UX ${index + 1}`}
                sx={{
                  height: '100%',
                  transform: index === 1 ? 'scale(0.9) translate(-24%, 3%)' : 'translateX(29%)'
                }}
              />
            </Box>
          ))}
        </Box>
        <Box mt={3} mb={2} display="flex" gap={2} flexWrap="wrap" justifyContent="center">
          <Button
            variant="outlined"
            size="large"
            href={`${DAPP_URL}/connect`}
            target="_blank"
            startIcon={<MdRocketLaunch size={20} />}
            sx={{
              borderRadius: 28,
              fontSize: 18,
              fontWeight: 'bold',
              px: 4,
              py: 1.5,
              borderColor: green.A700,
              color: green.A700,
              textTransform: 'none',
              width: 220,
              '&:hover': {
                backgroundColor: green[50],
                borderColor: green.A700
              }
            }}>
            Get Started
          </Button>
          <Button
            variant="contained"
            size="large"
            href="https://warpcast.com/~/composer-action?url=https://api.alpha.payflow.me/api/farcaster/composer/pay?action=app&view=prompt"
            target="_blank"
            startIcon={<SiFarcaster size={20} />}
            sx={{
              borderRadius: 28,
              fontSize: 18,
              fontWeight: 'bold',
              px: 4,
              py: 1.5,
              backgroundColor: farcasterPurple,
              color: 'white',
              textTransform: 'none',
              width: 220,
              '&:hover': {
                backgroundColor: '#7550B8'
              }
            }}>
            On Warpcast
          </Button>
        </Box>
      </Container>
    </CustomThemeProvider>
  );
}
