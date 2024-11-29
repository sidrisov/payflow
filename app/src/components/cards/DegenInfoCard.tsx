import { Typography, Skeleton, Button, Stack, IconButton, Chip } from '@mui/material';
import { useContext, useState } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { FARCASTER_DAPP } from '../../utils/dapps';
import { useIdentity } from '../../utils/queries/profiles';
import { InfoStack } from './InfoCard';
import { DEGEN_CLAIM_SEASONS, useAllowance, usePoints } from '../../utils/queries/degen';
import { ClaimDegenPointsDialog } from '../dialogs/ClaimDegenPointsDialog';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { formatAmountWithSuffix } from '../../utils/formats';
import { green, orange } from '@mui/material/colors';
import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';
import { tokens } from '@payflow/common';
import { base } from 'viem/chains';

export function DegenInfoCard() {
  const { profile } = useContext(ProfileContext);
  const { data: identity } = useIdentity(profile?.identity);

  const [currentSeasonIndex, setCurrentSeasonIndex] = useState<number>(
    DEGEN_CLAIM_SEASONS.findIndex((season) => season.id === 'seasonx')
  );

  const season = DEGEN_CLAIM_SEASONS[currentSeasonIndex];

  const publicClient = usePublicClient({
    chainId: season.chainId
  });

  const handleNextSeason = () => {
    setCurrentSeasonIndex((prevIndex) =>
      prevIndex < DEGEN_CLAIM_SEASONS.length - 1 ? prevIndex + 1 : prevIndex
    );
  };

  const handlePrevSeason = () => {
    setCurrentSeasonIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
  };

  const degenToken = tokens.find(
    (token) =>
      token.id === (season?.chainId === base.id ? 'degen' : 'wdegen') &&
      token.chainId === season?.chainId
  );

  const { data: contractDegenBalance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['contractDegenBalance', season?.contract],
    queryFn: async () => {
      if (!season?.contract || !degenToken) return 0n;

      const balance = await publicClient?.readContract({
        address: degenToken.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [season.contract]
      });

      return Number(formatUnits(balance ?? 0n, degenToken.decimals));
    },
    enabled: publicClient && !!season?.contract && !!degenToken
  });

  const isClaimingEnabled =
    season?.contract && contractDegenBalance && contractDegenBalance >= 50_000;

  const claimingOpenComponent =
    !isLoadingBalance && contractDegenBalance !== undefined ? (
      <Chip
        label={isClaimingEnabled ? 'Claiming is live' : 'Claiming is not live'}
        size="small"
        sx={{
          bgcolor: isClaimingEnabled ? green.A400 : orange[500],
          fontSize: 12,
          color: 'black',
          '& .MuiChip-label': {
            px: 1,
            fontWeight: 'bold'
          }
        }}
      />
    ) : null;

  console.log('Claiming Open Component:', claimingOpenComponent); // Keep this for debugging

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
  } = usePoints(verifications, season?.id as any);

  const [openClaimPointsDialog, setOpenClaimPointsDialog] = useState<boolean>(false);

  return (
    <>
      {season && (
        <InfoStack title={`Degen - ${season.name} Points`}>
          <Stack
            direction="row"
            minWidth={200}
            maxWidth={300}
            height={55}
            alignItems="center"
            justifyContent="space-between"
            spacing={1}>
            <IconButton onClick={handlePrevSeason} disabled={currentSeasonIndex === 0}>
              <ArrowBackIos fontSize="small" />
            </IconButton>
            {isFetchingAllowance || isFetchingPoints ? (
              <Skeleton
                variant="rectangular"
                width={100}
                height={60}
                sx={{ borderRadius: '15px' }}
              />
            ) : degenPoints ? (
              <Stack m={1} direction="row" alignItems="center" justifyContent="center" spacing={1}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                  {formatAmountWithSuffix(degenPoints.points)}
                </Typography>
                {Boolean(isClaimingEnabled) && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => setOpenClaimPointsDialog(true)}
                    sx={{ borderRadius: 3 }}>
                    Claim
                  </Button>
                )}
              </Stack>
            ) : (
              <Typography variant="subtitle2" color="inherit">
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
            <IconButton
              onClick={handleNextSeason}
              disabled={currentSeasonIndex === DEGEN_CLAIM_SEASONS.length - 1}>
              <ArrowForwardIos fontSize="small" />
            </IconButton>
          </Stack>
        </InfoStack>
      )}
      <InfoStack title="Degen - Everyday Allowance">
        {isFetchingAllowance || !fid ? (
          <Skeleton variant="rectangular" height={55} width={100} sx={{ borderRadius: '15px' }} />
        ) : allowance ? (
          <Typography m={1} p={1} variant="h4" fontWeight="bold">
            {formatAmountWithSuffix(allowance.remaining_tip_allowance)} /{' '}
            {formatAmountWithSuffix(allowance.tip_allowance)}
          </Typography>
        ) : (
          <Typography variant="subtitle2" color="inherit">
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
      {season && openClaimPointsDialog && degenPoints && (
        <ClaimDegenPointsDialog
          degenPoints={degenPoints}
          season={season}
          open={openClaimPointsDialog}
          onClose={() => {
            setOpenClaimPointsDialog(false);
          }}
        />
      )}
    </>
  );
}
