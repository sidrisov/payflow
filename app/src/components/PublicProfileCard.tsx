import {
  Avatar,
  Box,
  Button,
  Card,
  CardProps,
  CircularProgress,
  Stack,
  Typography
} from '@mui/material';
import { useMemo, useState } from 'react';
import { MetaType, ProfileType } from '../types/ProfleType';
import { useAccount } from 'wagmi';
import { AttachMoney, Send } from '@mui/icons-material';
import { useLazyQuery } from '@airstack/airstack-react';
import { ProfileSection } from './ProfileSection';
import { comingSoonToast } from './Toasts';
import SocialPresenceChipWithLink from './SocialPresenceChipWithLink';
import { QUERY_SOCIALS_MINIMAL, converSocialResults } from '../services/socials';
import PayProfileDialog from './PayProfileDialog';
import { green } from '@mui/material/colors';

export function PublicProfileCard({ profile, ...props }: { profile: ProfileType } & CardProps) {
  const [openPayDialog, setOpenPayDialog] = useState(false);

  const { address } = useAccount();

  const [fetch, { data: socialInfo, loading: loadingSocials }] = useLazyQuery(
    QUERY_SOCIALS_MINIMAL,
    { identity: profile.address, me: address ?? '' },
    {
      cache: true,
      dataFormatter(data) {
        return converSocialResults(data.Wallet) as MetaType;
      }
    }
  );

  useMemo(async () => {
    if (profile) {
      fetch();
    }
  }, [profile, address]);

  return (
    <>
      <Card
        {...props}
        elevation={10}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          m: 2,
          mt: 5,
          p: 2,
          border: 2,
          borderColor: 'divider',
          borderStyle: 'double',
          borderRadius: 5
        }}>
        <Stack spacing={1} direction="column" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <ProfileSection profile={profile} avatarSize={48} maxWidth={300} />
          </Stack>

          {loadingSocials && <CircularProgress color="inherit" size={20} />}
          {socialInfo && (
            <Stack>
              <Box flexWrap="wrap" display="flex" justifyContent="center" alignItems="center">
                <SocialPresenceChipWithLink
                  type={socialInfo.ens ? 'ens' : 'address'}
                  name={socialInfo.ens ?? profile.address}
                />

                {socialInfo.socials &&
                  socialInfo.socials
                    .filter((s: any) => s.profileName)
                    .map((s: any) => (
                      <SocialPresenceChipWithLink
                        key={s.dappName}
                        type={s.dappName}
                        name={s.profileName}
                      />
                    ))}
                {socialInfo.xmtp && (
                  <SocialPresenceChipWithLink
                    type="xmtp"
                    name={socialInfo.ens ?? profile.address}
                  />
                )}
              </Box>

              {(socialInfo.farcasterFollow || socialInfo.lensFollow) && (
                <Stack my={1} spacing={1} alignSelf="center" alignItems="flex-start">
                  {socialInfo.farcasterFollow && (
                    <Stack spacing={1} direction="row" alignItems="center">
                      <Avatar src="farcaster.svg" sx={{ width: 15, height: 15 }} />
                      <Typography variant="caption" fontWeight="bold" color={green.A700}>
                        {socialInfo.farcasterFollow === 'mutual'
                          ? 'Mutual follow on farcaster'
                          : 'You follow them on farcaster'}
                      </Typography>
                    </Stack>
                  )}
                  {socialInfo.lensFollow && (
                    <Stack spacing={1} direction="row" alignItems="center">
                      <Avatar src="lens.svg" sx={{ width: 15, height: 15 }} />
                      <Typography variant="caption" fontWeight="bold">
                        {socialInfo.lensFollow === 'mutual'
                          ? 'Mutual follow on lens'
                          : 'You follow them on lens'}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              )}
            </Stack>
          )}

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              color="inherit"
              variant="outlined"
              endIcon={<AttachMoney />}
              onClick={() => comingSoonToast()}
              sx={{ borderRadius: 5, textTransform: 'lowercase' }}>
              Tip
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              endIcon={<Send />}
              onClick={() => setOpenPayDialog(true)}
              sx={{
                borderRadius: 5,
                textTransform: 'lowercase'
              }}>
              Pay
            </Button>
          </Stack>
        </Stack>
      </Card>
      {openPayDialog && (
        <PayProfileDialog
          open={openPayDialog}
          profile={profile}
          closeStateCallback={async () => setOpenPayDialog(false)}
        />
      )}
    </>
  );
  {
    /*  <Stack
              overflow="auto"
              m={1}
              spacing={1}
              justifyContent={isSmallScreen ? 'flex-start' : 'center'}
              direction="row"
              p={1}>
              <Chip
                clickable
                icon={<MonetizationOn />}
                label="Tipping"
                sx={{ backgroundColor: 'inherit' }}></Chip>
              <Chip icon={<Savings />} label="Jars"></Chip>
              <Chip
                clickable
                icon={<Payment />}
                label="Subscriptions"
                sx={{ backgroundColor: 'inherit' }}></Chip>
              <Chip
                clickable
                icon={<Campaign />}
                label="Campaigns"
                sx={{ backgroundColor: 'inherit' }}></Chip>
            </Stack>

            <Typography variant="h6" textAlign="center">
              {comingSoonText}
            </Typography> */
  }

  {
    /* {flows &&
          flows.map((flow) => (
            <Card
              key={`flow_card_${flow.uuid}`}
              elevation={10}
              sx={{
                m: 2,
                p: 2,
                border: 3,
                borderRadius: 5,
                borderStyle: 'double',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center'
              }}>
              <Box
                sx={{
                  p: 0.8,
                  pb: 0.4,
                  borderRadius: 5,
                  border: 3,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'inherit'
                }}>
                <QRCode
                  size={100}
                  alignmentBaseline="baseline"
                  alphabetic="true"
                  value={`${DAPP_URL}/jar/${flow.uuid}`}
                />
              </Box>
              <Box
                ml={1}
                display="flex"
                flexDirection="column"
                justifyContent="flex-start"
                alignContent="flex-start"
                width={300}>
                <Box display="flex" flexDirection="row" justifyContent="space-between">
                  <Stack spacing={1}>
                    <Typography fontSize={20} fontWeight="bold" maxHeight={60} overflow="auto">
                      {flow.title}
                    </Typography>
                    <Typography fontSize={12} fontWeight="bold" maxHeight={50} overflow="auto">
                      {flow.description}
                    </Typography>
                  </Stack>
                </Box>
                <Box
                  display="flex"
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center">
                  <Typography variant="subtitle2">${0}</Typography>
                  <AvatarGroup
                    max={5}
                    total={flow.wallets.length}
                    sx={{
                      '& .MuiAvatar-root': { width: 20, height: 20, fontSize: 10 }
                    }}>
                    {[...Array(Math.min(4, flow.wallets.length))].map((_item, i) => (
                
                        <NetworkAvatar tooltip network={flow.wallets[i].network} />
                    ))}
                  </AvatarGroup>
                </Box>
              </Box>
              <IconButton
                color="inherit"
                onClick={async () => {
                  navigate(`/jar/${flow.uuid}`);
                }}
                sx={{ ml: 1, border: 1.5, borderStyle: 'dashed' }}>
                <ArrowForward fontSize="medium" />
              </IconButton>
            </Card>
          ))} */
  }
}
