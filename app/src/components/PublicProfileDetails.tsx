import { Avatar, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { MetaType, ProfileType } from '../types/ProfleType';
import { useAccount } from 'wagmi';
import { Send } from '@mui/icons-material';
import { useLazyQuery } from '@airstack/airstack-react';
import { ProfileSection } from './ProfileSection';
import SocialPresenceChipWithLink from './SocialPresenceChipWithLink';
import { QUERY_SOCIALS_MINIMAL, converSocialResults } from '../services/socials';
import PayProfileDialog from './PayProfileDialog';
import { green } from '@mui/material/colors';

export function PublicProfileDetails({ profile }: { profile: ProfileType }) {
  const [openPayDialog, setOpenPayDialog] = useState(false);

  const { address } = useAccount();

  const [fetch, { data: socialInfo, loading: loadingSocials }] = useLazyQuery(
    QUERY_SOCIALS_MINIMAL,
    { identity: profile.identity, me: address ?? '' },
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
      {' '}
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
                name={socialInfo.ens ?? profile.identity}
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
            </Box>

            {(socialInfo.farcasterFollow || socialInfo.lensFollow || socialInfo.sentTxs) && (
              <Stack my={1} spacing={1} alignSelf="center" alignItems="flex-start">
                {socialInfo.farcasterFollow && (
                  <Stack spacing={1} direction="row" alignItems="center">
                    <Avatar variant="rounded" src="farcaster.svg" sx={{ width: 15, height: 15 }} />
                    <Typography variant="caption" fontWeight="bold" color={green.A700}>
                      {socialInfo.farcasterFollow === 'mutual'
                        ? 'Mutual follow on farcaster'
                        : 'You follow them on farcaster'}
                    </Typography>
                  </Stack>
                )}
                {socialInfo.lensFollow && (
                  <Stack spacing={1} direction="row" alignItems="center">
                    <Avatar variant="rounded" src="lens.svg" sx={{ width: 15, height: 15 }} />
                    <Typography variant="caption" fontWeight="bold" color={green.A700}>
                      {socialInfo.lensFollow === 'mutual'
                        ? 'Mutual follow on lens'
                        : 'You follow them on lens'}
                    </Typography>
                  </Stack>
                )}
                {socialInfo.sentTxs && (
                  <Stack spacing={1} direction="row" alignItems="center">
                    <Avatar variant="rounded" src="ethereum.png" sx={{ width: 15, height: 15 }} />
                    <Typography variant="caption" fontWeight="bold" color={green.A700}>
                      {`Transacted ${
                        socialInfo.sentTxs === 1
                          ? 'once'
                          : (socialInfo.sentTxs > 5 ? '5+' : socialInfo.sentTxs) + ' times'
                      } onchain`}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        )}
        <Stack direction="row" spacing={1} alignItems="center">
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
          {socialInfo?.xmtp && (
            <SocialPresenceChipWithLink type="xmtp" name={socialInfo.ens ?? profile.identity} />
          )}
        </Stack>
      </Stack>
      {openPayDialog && (
        <PayProfileDialog
          open={openPayDialog}
          recipient={{
            type: 'profile',
            data: { profile }
          }}
          closeStateCallback={async () => setOpenPayDialog(false)}
        />
      )}
    </>
  );
}
