import {
  Box,
  Button,
  Chip,
  Container,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { useJar } from '../utils/queries/jars';
import JarActivityFeed from '../components/JarActivityFeed';
import { useContext, useMemo, useState } from 'react';
import { getSupportedTokens } from '../utils/erc20contracts';
import { Address, zeroAddress } from 'viem';
import { AssetType } from '../types/AssetType';
import { useAssetBalances } from '../utils/queries/balances';
import { lightGreen } from '@mui/material/colors';
import { Add, ArrowOutward, LinkOutlined, Public } from '@mui/icons-material';
import PaymentDialog, { PaymentSenderType } from '../components/dialogs/PaymentDialog';
import { useAccount } from 'wagmi';
import { ProfileContext } from '../contexts/UserContext';
import ChoosePaymentOptionDialog from '../components/dialogs/ChoosePaymentOptionDialog';
import { IdentityType, ProfileType } from '../types/ProfleType';
import ProfileAvatar from '../components/avatars/ProfileAvatar';
import { ProfileDisplayNameWithLink } from '../components/ProfileDisplayNameWithLink';
import { PublicProfileDetailsPopover } from '../components/menu/PublicProfileDetailsPopover';

export default function Jar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [openPayDialog, setOpenPayDialog] = useState(false);

  const { profile: loggedProfile } = useContext(ProfileContext);

  const { address } = useAccount();

  const [paymentType, setPaymentType] = useState<PaymentSenderType>(
    !loggedProfile ? 'wallet' : 'none'
  );

  const { uuid } = useParams();

  const { isLoading, isFetched, data: jar } = useJar(uuid);

  const [profileDetailsPopoverAnchorEl, setProfileDetailsPopoverAnchorEl] =
    useState<null | HTMLElement>(null);
  const [popoverProfile, setPopOverProfile] = useState<ProfileType>();

  const [assets, setAssets] = useState<AssetType[]>([]);

  useMemo(async () => {
    let assets: AssetType[] = [];

    if (jar?.flow) {
      jar.flow.wallets.forEach((wallet) => {
        const chainId = wallet.network;
        if (chainId) {
          const tokens = getSupportedTokens(chainId);
          tokens.forEach((token) => {
            assets.push({
              address: wallet.address,
              chainId,
              token: token.address !== zeroAddress ? token.address : undefined
            });
          });
        }
      });
    }

    console.log('Assets:', assets);

    setAssets(assets);
  }, [jar?.flow]);

  const {
    isLoading: isBalanceLoading,
    isFetched: isBalanceFetched,
    data: balances
  } = useAssetBalances(assets);
  const [totalBalance, setTotalBalance] = useState<string>();

  useMemo(async () => {
    if (isBalanceFetched && balances && balances.length > 0) {
      const totalBalance = balances
        .filter((balance) => balance.balance)
        .reduce((previousValue, currentValue) => {
          return previousValue + currentValue.usdValue;
        }, 0)
        .toFixed(1);

      setTotalBalance(totalBalance);
    }
  }, [isBalanceFetched, balances]);

  return (
    <>
      <Helmet>
        <title>Payflow Jar {jar ? ' | ' + jar.flow.title : ''}</title>
      </Helmet>
      <Container maxWidth="xs">
        {jar && (
          <Stack spacing={2} alignItems="center" width={375}>
            <Typography textAlign="center" variant="h5">
              <b>{jar.flow.title}</b>
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography fontSize={isMobile ? 12 : 14}>created by</Typography>
              <ProfileAvatar profile={jar.profile} sx={{ width: 25, height: 25 }} />
              <ProfileDisplayNameWithLink
                profile={jar.profile}
                aria-owns={popoverProfile ? 'public-profile-popover' : undefined}
                onMouseEnter={(event) => {
                  setProfileDetailsPopoverAnchorEl(event.currentTarget);
                  setPopOverProfile(jar.profile);
                }}
                onMouseLeave={() => {
                  setProfileDetailsPopoverAnchorEl(null);
                  setPopOverProfile(undefined);
                }}
              />
            </Stack>

            {isBalanceLoading || !totalBalance ? (
              <Skeleton variant="rectangular" height={50} width={80} sx={{ borderRadius: 3 }} />
            ) : (
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ p: 1.5, border: 1, borderRadius: 5 }}>
                {' '}
                ${isBalanceFetched ? totalBalance : 'N/A'}
              </Typography>
            )}

            <Button
              variant="text"
              startIcon={<Add />}
              sx={{
                color: lightGreen.A700,
                borderRadius: 5,
                borderColor: lightGreen.A700,
                fontWeight: 'bold'
              }}
              onClick={() => setOpenPayDialog(true)}>
              Contribute
            </Button>

            <Typography
              variant="body1"
              maxHeight={100}
              textOverflow="clip"
              sx={{ px: 1, overflow: 'scroll' }}>
              {jar.description}
            </Typography>
            {jar.image && <Box component="img" src={jar.image} maxWidth="100%" borderRadius={3} />}
            {jar.link && (
              <Chip
                avatar={<ArrowOutward fontSize="small" />}
                label={'More details'}
                variant="outlined"
                clickable
                component="a"
                target="_blank"
                href={jar.link}
                sx={{ fontWeight: 'bold' }}
              />
            )}

            <Box width="100%">
              <JarActivityFeed flow={jar?.flow} />
            </Box>
          </Stack>
        )}
        {openPayDialog && jar && (
          <>
            <PaymentDialog
              open={openPayDialog && (!loggedProfile || paymentType !== 'none')}
              paymentType={paymentType}
              sender={
                paymentType === 'wallet'
                  ? (address as Address)
                  : loggedProfile && loggedProfile.defaultFlow
                  ? loggedProfile.defaultFlow
                  : (address as Address)
              }
              recipient={{
                type: 'profile',
                identity: { profile: { ...jar.profile, defaultFlow: jar.flow } } as IdentityType
              }}
              closeStateCallback={async () => {
                setOpenPayDialog(false);
                setPaymentType('none');
              }}
            />

            <ChoosePaymentOptionDialog
              open={Boolean(loggedProfile) && paymentType === 'none'}
              setPaymentType={setPaymentType}
              closeStateCallback={async () => setOpenPayDialog(false)}
            />
          </>
        )}
        {popoverProfile !== undefined && (
          <PublicProfileDetailsPopover
            open={popoverProfile !== undefined}
            onClose={async () => setPopOverProfile(undefined)}
            anchorEl={profileDetailsPopoverAnchorEl}
            profile={popoverProfile}
          />
        )}
      </Container>
    </>
  );
}
