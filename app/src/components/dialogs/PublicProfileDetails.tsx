import { Avatar, Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import { IdentityType } from '../../types/ProfleType';
import { useAccount } from 'wagmi';
import { CropSquare, Send } from '@mui/icons-material';
import { ProfileSection } from '../ProfileSection';
import SocialPresenceChipWithLink from '../chips/SocialPresenceChipWithLink';
import { green } from '@mui/material/colors';
import { Address } from 'viem';
import PaymentDialog, { PaymentSenderType } from './PaymentDialog';
import { ProfileContext } from '../../contexts/UserContext';
import ChoosePaymentOptionDialog from './ChoosePaymentOptionDialog';
import { AddressSection } from '../AddressSection';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { FRAMES_URL } from '../../utils/urlConstants';
import { toast } from 'react-toastify';

export function PublicProfileDetails({
  openPayDialogParam = false,
  identity
}: {
  openPayDialogParam?: boolean;
  identity: IdentityType;
}) {
  const [openPayDialog, setOpenPayDialog] = useState(openPayDialogParam);

  const { profile: loggedProfile } = useContext(ProfileContext);

  const { address } = useAccount();

  const [paymentType, setPaymentType] = useState<PaymentSenderType>(
    !loggedProfile ? 'wallet' : 'none'
  );

  const socialInfo = identity?.meta;

  return (
    <>
      <Stack spacing={1} direction="column" alignItems="center">
        <Stack direction="row" alignItems="center" spacing={1}>
          {identity?.profile ? (
            <ProfileSection profile={identity.profile} maxWidth={300} />
          ) : (
            identity?.meta && <AddressSection maxWidth={300} identity={identity} />
          )}
        </Stack>
        {socialInfo && (
          <Stack>
            <Box flexWrap="wrap" display="flex" justifyContent="center" alignItems="center">
              <SocialPresenceChipWithLink
                type={socialInfo.ens ? 'ens' : 'address'}
                name={socialInfo.ens ?? identity.address}
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
                socialInfo.insights.sentTxs > 0) && (
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
                  {socialInfo.insights.sentTxs > 0 && (
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
            <SocialPresenceChipWithLink type="xmtp" name={socialInfo.ens ?? identity.address} />
          )}
          <Tooltip title="Copy payment frame link">
            <IconButton
              color="inherit"
              onClick={() => {
                copyToClipboard(`${FRAMES_URL}/${identity.address}`);
                toast.success('Payment frame link copied!');
              }}
              sx={{ border: 1, width: 36, height: 36 }}>
              <CropSquare fontSize="medium" />
            </IconButton>
          </Tooltip>
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
              type: identity.profile ? 'profile' : 'address',
              identity
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
