import { Card, CardHeader, CardContent, Typography, Skeleton } from '@mui/material';
import { useAvailableMoxieRewards } from '../../utils/queries/moxie';
import { FARCASTER_DAPP } from '../../utils/dapps';
import { useIdentity } from '../../utils/queries/profiles';
import { useContext } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { normalizeNumberPrecision } from '../../utils/formats';

export function AvailableMoxieRewardsCard() {
  const { profile } = useContext(ProfileContext);

  const { data: identity } = useIdentity(profile?.identity);
  const fid = identity?.meta?.socials?.find((s) => s.dappName === FARCASTER_DAPP)?.profileId;

  const { isFetching: isFetchingRewards, data: availableRewards } = useAvailableMoxieRewards(
    fid ? parseInt(fid) : undefined
  );

  return (
    <Card
      elevation={12}
      sx={{
        p: 1,
        borderRadius: '25px',
        width: '100%'
      }}>
      <CardHeader
        title="Ⓜ️ Moxie rewards"
        titleTypographyProps={{
          fontSize: 18,
          fontWeight: 'bold',
          textAlign: 'center'
        }}
        sx={{ p: 1 }}
      />
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 0,
          '&:last-child': {
            paddingBottom: 0.5
          }
        }}>
        {isFetchingRewards ? (
          <Skeleton variant="rectangular" height={55} width={100} sx={{ borderRadius: '15px' }} />
        ) : availableRewards ? (
          <Typography m={1} variant="h4" fontWeight="bold">
            {normalizeNumberPrecision(availableRewards)}
          </Typography>
        ) : (
          <Typography fontSize={14}>No available moxie rewards</Typography>
        )}
      </CardContent>
    </Card>
  );
}
