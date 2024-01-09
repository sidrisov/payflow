import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { ProfileType, SelectedProfileWithSocialsType } from '../types/ProfleType';
import { HomeOutlined, Menu } from '@mui/icons-material';
import SearchProfileDialog from '../components/SearchProfileDialog';
import { green, grey, orange } from '@mui/material/colors';
import { AppSettings } from '../types/AppSettingsType';
import CenteredCircularProgress from '../components/CenteredCircularProgress';
import { PublicProfileCard } from '../components/PublicProfileCard';
import HideOnScroll from '../components/HideOnScroll';
import HomeLogo from '../components/Logo';
import { WalletMenu } from '../components/WalletMenu';
import { useAccount, useContractRead, useEnsAddress } from 'wagmi';
import PayProfileDialog from '../components/PayProfileDialog';
import { getProfileByAddressOrName } from '../services/user';
import { AnonymousUserContext } from '../contexts/UserContext';
import { formatUnits } from 'viem';

import AggregatorV2V3Interface from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/interfaces/AggregatorV2V3Interface.sol/AggregatorV2V3Interface.json';

export default function PublicProfile({
  appSettings,
  setAppSettings
}: {
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();

  const { username } = useParams();
  const [profile, setProfile] = useState<ProfileType>();
  const [loadingProfile, setLoadingProfile] = useState<boolean>();

  const { darkMode } = appSettings;

  const [openSearchProfile, setOpenSearchProfile] = useState<boolean>(false);
  const [walletMenuAnchorEl, setWalletMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openWalletMenu, setOpenWalletMenu] = useState(false);

  const { address } = useAccount();

  const [selectedRecipient, setSelectedRecipient] = useState<SelectedProfileWithSocialsType>();

  const { isSuccess: isEnsSuccess, data: ethUsdPriceFeedAddress } = useEnsAddress({
    name: 'eth-usd.data.eth',
    chainId: 1,
    cacheTime: 300_000
  });

  const { data: ethUsdPrice } = useContractRead({
    enabled: isEnsSuccess && ethUsdPriceFeedAddress !== undefined,
    chainId: 1,
    address: ethUsdPriceFeedAddress ?? undefined,
    abi: AggregatorV2V3Interface.abi,
    functionName: 'latestAnswer',
    select: (data) => Number(formatUnits(data as bigint, 8)),
    cacheTime: 10_000
  });

  useMemo(async () => {
    if (username) {
      setLoadingProfile(true);
      try {
        const profile = await getProfileByAddressOrName(username);
        setProfile(profile);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingProfile(false);
      }
    }
  }, [username]);

  return (
    <AnonymousUserContext.Provider
      value={{
        appSettings,
        setAppSettings,
        ethUsdPrice
      }}>
      <Helmet>
        <title> Payflow {profile ? '| ' + profile.displayName : ''} </title>
      </Helmet>
      <Container maxWidth={!loadingProfile && !profile ? 'sm' : 'xs'}>
        {username && !loadingProfile && !profile && (
          <Stack mt={10}>
            <Typography
              variant="h6"
              fontSize={isMobile ? 16 : 20}
              textAlign="center"
              color={orange.A400}>
              Ooops, profile{' '}
              <b>
                <u>{username}</u>
              </b>{' '}
              not found 🤷🏻‍♂️
            </Typography>
            <Typography
              variant="h6"
              fontSize={isMobile ? 16 : 20}
              textAlign="center"
              color={orange.A400}>
              Try to search by social 👇🏻
            </Typography>
          </Stack>
        )}

        {loadingProfile === true ? (
          <CenteredCircularProgress />
        ) : profile ? (
          <>
            <HideOnScroll>
              <AppBar
                position="sticky"
                color="transparent"
                elevation={0}
                sx={{ backdropFilter: 'blur(5px)' }}>
                <Toolbar>
                  <Box
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    flexGrow={1}>
                    <Stack direction="row" alignItems="center">
                      <IconButton color="inherit" onClick={() => navigate('/home')}>
                        <HomeOutlined />
                      </IconButton>
                      <HomeLogo />
                    </Stack>
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
                        setOpenSearchProfile(true);
                      }}>
                      <Avatar src="payflow.png" sx={{ width: 24, height: 24 }} />
                      <Typography variant="subtitle2">Search ... </Typography>
                    </Box>

                    <IconButton
                      color="inherit"
                      onClick={async (event) => {
                        setWalletMenuAnchorEl(event.currentTarget);
                        setOpenWalletMenu(true);
                      }}>
                      <Menu />
                    </IconButton>
                  </Box>
                </Toolbar>
              </AppBar>
            </HideOnScroll>
            <PublicProfileCard profile={profile} />
          </>
        ) : (
          <Box
            position="absolute"
            display="flex"
            flexDirection="column"
            alignItems="center"
            boxSizing="border-box"
            justifyContent="center"
            sx={{ inset: 0 }}>
            <Stack spacing={1} alignItems="center" sx={{ border: 0 }}>
              <Badge
                badgeContent={
                  <Typography
                    variant={isMobile ? 'h6' : 'h5'}
                    fontWeight="900"
                    color={green.A700}
                    sx={{ mb: 3, ml: isMobile ? -20 : 0 }}>
                    made easy
                  </Typography>
                }>
                <Typography
                  maxWidth={isMobile ? 350 : 600}
                  variant={isMobile ? 'h4' : 'h3'}
                  fontWeight="500"
                  textAlign="center">
                  Onchain Social Payments
                </Typography>
              </Badge>

              <Typography
                variant="h6"
                fontSize={isMobile ? 16 : 20}
                fontWeight="900"
                color={green.A700}
                textAlign="center">
                abstracted | gasless | non-custodial
              </Typography>

              <Typography
                variant="caption"
                fontSize={isMobile ? 14 : 16}
                color="grey"
                textAlign="center">
                farcaster | lens | ens supported
              </Typography>

              <Chip
                size="medium"
                clickable
                icon={<Avatar src="payflow.png" sx={{ width: 32, height: 32 }} />}
                variant="outlined"
                label="search & pay"
                onClick={() => {
                  setOpenSearchProfile(true);
                }}
                sx={{
                  border: 2,
                  backgroundColor: darkMode ? grey[800] : grey[50],
                  borderStyle: 'dotted',
                  borderColor: 'divider',
                  borderRadius: 10,
                  width: 220,
                  '& .MuiChip-label': { fontSize: 20 },
                  height: 50
                }}
              />
            </Stack>
          </Box>
        )}
      </Container>
      <SearchProfileDialog
        address={address}
        profileRedirect={true}
        walletMenuEnabled={true}
        selectProfileCallback={(selectedProfileWithSocials) => {
          setSelectedRecipient(selectedProfileWithSocials);
        }}
        open={openSearchProfile}
        sx={{
          backdropFilter: 'blur(10px)'
        }}
        closeStateCallback={() => {
          setOpenSearchProfile(false);
        }}
      />
      {selectedRecipient && (
        <PayProfileDialog
          open={selectedRecipient !== undefined}
          recipient={selectedRecipient}
          closeStateCallback={async () => {
            setSelectedRecipient(undefined);
          }}
        />
      )}
      <WalletMenu
        anchorEl={walletMenuAnchorEl}
        open={openWalletMenu}
        onClose={() => setOpenWalletMenu(false)}
        closeStateCallback={() => setOpenWalletMenu(false)}
      />
    </AnonymousUserContext.Provider>
  );
}
