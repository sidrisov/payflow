import { Typography, Skeleton, Button } from '@mui/material';
import { useContext, useState } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { FARCASTER_DAPP } from '../../utils/dapps';
import { useIdentity } from '../../utils/queries/profiles';
import InfoCard, { InfoStack } from './InfoCard';
import { useAllowance, usePoints } from '../../utils/queries/degen';
import { ClaimDegenPointsDialog } from '../dialogs/ClaimDegenPointsDialog';

export function DegenInfoCard() {
  const { profile } = useContext(ProfileContext);

  const { data: identity } = useIdentity(profile?.identity);

  const fid =
    Number(identity?.meta?.socials?.find((s) => s.dappName === FARCASTER_DAPP)?.profileId) ||
    undefined;

  const {
    isFetching: isFetchingAllowance,
    data: allowance,
    error: allowanceError
  } = useAllowance(fid);

  const verifications = profile?.flows
    ?.filter((flow) => flow.type === 'FARCASTER_VERIFICATION')
    .map((flow) => flow.wallets[0].address);

  const {
    isFetching: isFetchingPoints,
    data: degenPoints,
    error: pointsError
  } = usePoints(verifications);

  const [openClaimPointsDialog, setOpenClaimPointsDialog] = useState<boolean>(false);

  return (
    <InfoCard title="🎩 Degen Center">
      <InfoStack title="Everyday Allowance">
        {isFetchingAllowance || !fid ? (
          <Skeleton variant="rectangular" height={55} width={100} sx={{ borderRadius: '15px' }} />
        ) : allowance ? (
          <Typography m={1} p={1} variant="h4" fontWeight="bold">
            {allowance.remaining_tip_allowance} / {allowance.tip_allowance}
          </Typography>
        ) : (
          <Typography fontSize={14} color="inherit">
            {!allowanceError ? (
              'Allowance not available'
            ) : (
              <>
                {allowanceError.message}
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
      <InfoStack title="Current Season Points">
        {isFetchingAllowance || isFetchingPoints ? (
          <Skeleton variant="rectangular" height={55} width={100} sx={{ borderRadius: '15px' }} />
        ) : degenPoints ? (
          <Typography
            m={1}
            p={1}
            variant="h4"
            fontWeight="bold"
            component={Button}
            sx={{
              borderRadius: 5,
              border: 2,
              borderStyle: 'dotted',
              borderColor: 'divider',
              textTransform: 'none',
              color: 'inherit'
            }}
            onClick={() => {
              setOpenClaimPointsDialog(true);
            }}>
            {degenPoints.points}
          </Typography>
        ) : (
          <Typography fontSize={14} color="inherit">
            {!pointsError ? (
              'No points'
            ) : (
              <>
                {pointsError.message}
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
      {openClaimPointsDialog && degenPoints && (
        <ClaimDegenPointsDialog
          degenPoints={degenPoints}
          open={openClaimPointsDialog}
          onClose={() => {
            setOpenClaimPointsDialog(false);
          }}
        />
      )}
    </InfoCard>
  );
}
