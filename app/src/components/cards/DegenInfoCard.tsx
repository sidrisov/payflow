import { Typography, Skeleton } from '@mui/material';
import { useContext } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { FARCASTER_DAPP } from '../../utils/dapps';
import { useIdentity } from '../../utils/queries/profiles';
import InfoCard, { InfoStack } from './InfoCard';
import { useAllowance, usePoints } from '../../utils/queries/degen';

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

  const {
    isFetching: isFetchingPoints,
    data: points,
    error: pointsError
  } = usePoints(allowance?.walletAddresses);

  return (
    <InfoCard title="🎩 Degen Center">
      <InfoStack title="Everyday Allowance">
        {isFetchingAllowance || !fid ? (
          <Skeleton variant="rectangular" height={55} width={100} sx={{ borderRadius: '15px' }} />
        ) : allowance ? (
          <Typography
            m={1}
            p={1}
            variant="h4"
            fontWeight="bold"
            sx={{
              borderRadius: 5,
              border: 2,
              borderColor: 'divider',
              textTransform: 'none',
              color: 'inherit'
            }}>
            {allowance.remainingTipAllowance} / {allowance.tipAllowance}
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
      <InfoStack title="Claimable Season Points">
        {isFetchingPoints || isFetchingAllowance ? (
          <Skeleton variant="rectangular" height={55} width={100} sx={{ borderRadius: '15px' }} />
        ) : points ? (
          <Typography
            m={1}
            p={1}
            variant="h4"
            fontWeight="bold"
            sx={{
              borderRadius: 5,
              border: 2,
              borderColor: 'divider',
              textTransform: 'none',
              color: 'inherit'
            }}>
            {points.points}
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
    </InfoCard>
  );
}
