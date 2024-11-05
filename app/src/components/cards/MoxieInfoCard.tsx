import { Stack, Typography, Skeleton, Button } from '@mui/material';
import { useContext, useState } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { FARCASTER_DAPP } from '../../utils/dapps';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { useAvailableMoxieRewards as useMoxieRewards } from '../../utils/queries/moxie';
import { useIdentity } from '../../utils/queries/profiles';
import { ClaimMoxieRewardsDialog } from '../dialogs/ClaimMoxieRewardsDialog';
import { InfoStack } from './InfoCard';

export function MoxieInfoCard() {
  const { profile } = useContext(ProfileContext);

  const { data: identity } = useIdentity(profile?.identity);

  const fid =
    Number(identity?.meta?.socials?.find((s) => s.dappName === FARCASTER_DAPP)?.profileId) ||
    undefined;

  const {
    isFetching: isFetchingRewards,
    data: rewards,
    error: rewardsError
  } = useMoxieRewards(fid);

  const [openClaimRewardsDialog, setOpenClaimRewardsDialog] = useState<boolean>(false);

  return (
    <>
      <InfoStack title="Moxie Claimable / Total Rewards">
        {isFetchingRewards || !fid ? (
          <Skeleton variant="rectangular" height={55} width={100} sx={{ borderRadius: '15px' }} />
        ) : rewards ? (
          <Stack
            height={55}
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
              {formatAmountWithSuffix(normalizeNumberPrecision(rewards.availableClaimAmount))} /{' '}
              {formatAmountWithSuffix(normalizeNumberPrecision(rewards.claimedAmount))}
            </Typography>
            {rewards.availableClaimAmount > 0 && (
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => setOpenClaimRewardsDialog(true)}
                sx={{ borderRadius: 3 }}>
                Claim
              </Button>
            )}
          </Stack>
        ) : (
          <Typography variant="subtitle2" color="inherit">
            {!rewardsError ? (
              'Unable to fetch reward information'
            ) : (
              <>
                {rewardsError.message}
                {'! '}
                <a
                  href="https://warpcast.com/~/inbox/create/19129"
                  target="_blank"
                  style={{ color: 'inherit' }}>
                  Contact Support
                </a>{' '}
                💬
              </>
            )}
          </Typography>
        )}
      </InfoStack>

      {openClaimRewardsDialog && fid && (
        <ClaimMoxieRewardsDialog
          fid={fid}
          claimableRewardsAmount={rewards?.availableClaimAmount}
          open={openClaimRewardsDialog}
          onClose={() => {
            setOpenClaimRewardsDialog(false);
          }}
        />
      )}
    </>
  );
}
