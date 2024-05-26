import { Avatar, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import { IdentityType, ProfileType } from '../../types/ProfleType';
import { useAccount } from 'wagmi';
import { Send } from '@mui/icons-material';
import { useQuery } from '@airstack/airstack-react';
import { ProfileSection } from '../ProfileSection';
import SocialPresenceChipWithLink from '../chips/SocialPresenceChipWithLink';
import { convertSocialResults } from '../../services/socials';
import { green } from '@mui/material/colors';
import { Address } from 'viem';
import PaymentDialog, { PaymentSenderType } from './PaymentDialog';
import { ProfileContext } from '../../contexts/UserContext';
import { QUERY_SOCIALS_INSIGHTS_LIGHT, QUERY_SOCIALS_LIGHT } from '../../utils/airstackQueries';
import ChoosePaymentOptionDialog from './ChoosePaymentOptionDialog';

export function PublicProfileDetails({
  openPayDialogParam = false,
  profile
}: {
  openPayDialogParam?: boolean;
  profile: ProfileType;
}) {
  const [openPayDialog, setOpenPayDialog] = useState(openPayDialogParam);

  const { profile: loggedProfile } = useContext(ProfileContext);

  const { address } = useAccount();

  const [paymentType, setPaymentType] = useState<PaymentSenderType>(
    !loggedProfile ? 'wallet' : 'none'
  );

  const { data: socialInfo, loading: loadingSocials } = useQuery(
    (address ?? loggedProfile?.identity) &&
      profile.identity !== loggedProfile?.identity &&
      profile.identity !== address
      ? QUERY_SOCIALS_INSIGHTS_LIGHT
      : QUERY_SOCIALS_LIGHT,
    { identity: profile.identity, me: address ?? loggedProfile?.identity },
    {
      cache: true,
      dataFormatter(data) {
        return convertSocialResults(data.Wallet).data.meta;
      }
    }
  );

  return (
    <>
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

            {socialInfo.insights &&
              (socialInfo.insights.farcasterFollow ||
                socialInfo.insights.lensFollow ||
                socialInfo.insights.sentTxs) && (
                <Stack my={1} spacing={1} alignSelf="center" alignItems="flex-start">
                  {socialInfo.insights.farcasterFollow && (
                    <Stack spacing={1} direction="row" alignItems="center">
                      <Avatar
                        variant="rounded"
                        src="/farcaster.svg"
                        sx={{ width: 15, height: 15 }}
                      />
                      <Typography variant="caption" fontWeight="bold" color={green.A700}>
                        {socialInfo.insights.farcasterFollow === 'mutual'
                          ? 'Mutual follow on farcaster'
                          : 'You follow them on farcaster'}
                      </Typography>
                    </Stack>
                  )}
                  {socialInfo.insights.lensFollow && (
                    <Stack spacing={1} direction="row" alignItems="center">
                      <Avatar variant="rounded" src="/lens.svg" sx={{ width: 15, height: 15 }} />
                      <Typography variant="caption" fontWeight="bold" color={green.A700}>
                        {socialInfo.insights.lensFollow === 'mutual'
                          ? 'Mutual follow on lens'
                          : 'You follow them on lens'}
                      </Typography>
                    </Stack>
                  )}
                  {socialInfo.insights.sentTxs && (
                    <Stack spacing={1} direction="row" alignItems="center">
                      <Avatar
                        variant="rounded"
                        src="/ethereum.png"
                        sx={{ width: 15, height: 15 }}
                      />
                      <Typography variant="caption" fontWeight="bold" color={green.A700}>
                        {`Transacted ${
                          socialInfo.insights.sentTxs === 1
                            ? 'once'
                            : (socialInfo.insights.sentTxs > 5
                                ? '5+'
                                : socialInfo.insights.sentTxs) + ' times'
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
        <>
          <PaymentDialog
            open={openPayDialog && (!loggedProfile || paymentType !== 'none')}
            paymentType={paymentType}
            sender={{
              type: paymentType === 'payflow' ? 'profile' : 'address',
              identity: {
                address:
                  paymentType === 'payflow'
                    ? (loggedProfile?.identity as Address)
                    : (address as Address),
                ...(paymentType === 'payflow' && { profile: loggedProfile })
              }
            }}
            recipient={{
              type: 'profile',
              identity: { profile } as IdentityType
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
    </>
  );
}
