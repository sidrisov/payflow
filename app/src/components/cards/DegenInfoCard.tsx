import { Typography, Skeleton, Button, Stack, IconButton, Chip } from '@mui/material';
import { useContext, useState, useMemo } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { FARCASTER_DAPP } from '../../utils/dapps';
import { useIdentity } from '../../utils/queries/profiles';
import { InfoStack } from './InfoCard';
import { DEGEN_CLAIM_SEASONS, useAllowance, usePoints } from '../../utils/queries/degen';
import { ClaimDegenPointsDialog } from '../dialogs/ClaimDegenPointsDialog';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { formatAmountWithSuffix } from '../../utils/formats';
import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';
import { tokens } from '@payflow/common';
import { base } from 'viem/chains';
import { degenClaimAbi } from '../../utils/abi/degenClaimAbi';
import { useReadContract } from 'wagmi';
import { useMerkleProofs } from '../../utils/queries/degen';

export function DegenInfoCard() {
  const { profile } = useContext(ProfileContext);
  const { data: identity } = useIdentity(profile?.identity);

  const [currentSeasonIndex, setCurrentSeasonIndex] = useState<number>(
    DEGEN_CLAIM_SEASONS.findIndex((season) => season.id === 'current')
  );
  const [openClaimPointsDialog, setOpenClaimPointsDialog] = useState<boolean>(false);
  const season = DEGEN_CLAIM_SEASONS[currentSeasonIndex];

  const publicClient = usePublicClient({
    chainId: season.chainId
  });

  const degenToken = useMemo(
    () =>
      tokens.find(
        (token) =>
          token.id === (season?.chainId === base.id ? 'degen' : 'wdegen') &&
          token.chainId === season?.chainId
      ),
    [season?.chainId]
  );

  const fid = useMemo(
    () =>
      Number(identity?.meta?.socials?.find((s) => s.dappName === FARCASTER_DAPP)?.profileId) ||
      undefined,
    [identity?.meta?.socials]
  );

  const verifications = useMemo(
    () =>
      profile?.flows
        ?.filter((flow) => flow.type === 'FARCASTER_VERIFICATION')
        .map((flow) => flow.wallets[0].address),
    [profile?.flows]
  );

  const {
    isFetching: isFetchingAllowance,
    data: allowance,
    error: allowanceError
  } = useAllowance(fid);

  const {
    isFetching: isFetchingPoints,
    data: degenPoints,
    error: pointsError
  } = usePoints(verifications, season?.id as any);

  const { data: merkleProofs } = useMerkleProofs(degenPoints?.wallet_address, season?.id);
  const { data: isClaimedAlready, isFetching: isFetchingClaim } = useReadContract(
    season?.contract && {
      abi: degenClaimAbi,
      chainId: season?.chainId,
      address: season?.contract,
      functionName: 'isClaimed',
      args: merkleProofs && [BigInt(merkleProofs?.index)]
    }
  );

  const { data: contractDegenBalance, isLoading: isLoadingBalance } = useQuery({
    enabled: publicClient && !!season?.contract && !!degenToken && !isClaimedAlready,
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
    }
  });

  const isClaimingEnabled =
    season?.contract && contractDegenBalance && contractDegenBalance >= 50_000;

  const handleNextSeason = () => {
    setCurrentSeasonIndex((prevIndex) =>
      prevIndex < DEGEN_CLAIM_SEASONS.length - 1 ? prevIndex + 1 : prevIndex
    );
  };

  const handlePrevSeason = () => {
    setCurrentSeasonIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
  };

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
            {isFetchingAllowance || isFetchingPoints || isFetchingClaim ? (
              <Skeleton variant="rectangular" width={100} height={60} />
            ) : degenPoints ? (
              <Stack m={1} direction="row" alignItems="center" justifyContent="center" spacing={1}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                  {formatAmountWithSuffix(degenPoints.points)}
                </Typography>
                {Boolean(isClaimedAlready) ? (
                  <Chip
                    label="Claimed"
                    color="primary"
                    sx={{
                      fontWeight: 'bold'
                    }}
                  />
                ) : (
                  Boolean(isClaimingEnabled) && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={() => setOpenClaimPointsDialog(true)}>
                      Claim
                    </Button>
                  )
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
          <Skeleton variant="rectangular" height={55} width={100} />
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
