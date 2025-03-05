import ResponsiveDialog, { ResponsiveDialogProps } from './ResponsiveDialog';
import { Box, Divider, Stack, Typography, Button } from '@mui/material';
import { useEffect } from 'react';
import { CustomLoadingButton } from '../buttons/LoadingPaymentButton';
import { red } from '@mui/material/colors';
import { DegenClaimSeason, DegenPoints, useMerkleProofs } from '../../utils/queries/degen';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { toast } from 'react-toastify';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { LoadingConnectWalletButton } from '../buttons/LoadingConnectWalletButton';
import { LoadingSwitchChainButton } from '../buttons/LoadingSwitchNetworkButton';
import { IoIosWallet } from 'react-icons/io';
import { degenClaimAbi } from '../../utils/abi/degenClaimAbi';
import { delay } from '../../utils/delay';
import { useNavigate } from 'react-router';
import { formatAmountWithSuffix } from '../../utils/formats';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import { base } from 'viem/chains';

export function ClaimDegenPointsDialog({
  degenPoints,
  season,
  ...props
}: { degenPoints: DegenPoints; season: DegenClaimSeason } & ResponsiveDialogProps) {
  const { address, chainId } = useAccount();
  const navigate = useNavigate();
  const publicClient = usePublicClient({ chainId: season.chainId });

  const {
    isFetching: isFetchingMerkleProofs,
    data: merkleProofs,
    error: merkleProofsError
  } = useMerkleProofs(degenPoints.wallet_address, season.id);

  const {
    isPending: isClaimCheckPending,
    data: isClaimedAlready,
    isError: isClaimCheckError
  } = useReadContract({
    abi: degenClaimAbi,
    chainId: season.chainId,
    address: season.contract,
    functionName: 'isClaimed',
    args: merkleProofs && [BigInt(merkleProofs?.index)]
  });

  console.log(
    `Check if claimed [${season.id}]: isClaimed=${isClaimedAlready} isError=${isClaimCheckError}`
  );

  const {
    isPending: isClaimPending,
    isSuccess: claimed,
    isError: isClaimError,
    error: claimError,
    writeContract
  } = useWriteContract();

  console.log(
    `Claiming status [${season.id}]: isClaiming=${isClaimPending} isError=${isClaimError} - ${claimError}`
  );

  // Replace the balance check query
  const { data: walletNativeBalance = 0, isPending: isWalletNativeBalancePending } = useQuery({
    enabled: Boolean(degenPoints.wallet_address),
    queryKey: ['walletNativeBalance', degenPoints.wallet_address],
    queryFn: async () => {
      if (!degenPoints.wallet_address) return 0;

      const balance = await publicClient?.getBalance({
        address: degenPoints.wallet_address as `0x${string}`
      });

      return Number(formatUnits(balance ?? 0n, 18));
    }
  });

  const hasEnoughNative = walletNativeBalance >= (season.chainId === base.id ? 0.0001 : 10);

  useEffect(() => {
    if (isClaimedAlready) {
      toast.success(`Claimed ${season.name} already!`, {
        autoClose: 2_000
      });
      props.onClose();
      return;
    }

    if (!season.contract || merkleProofsError || (!isFetchingMerkleProofs && !merkleProofs)) {
      toast.warn(`${season.name} claiming hasn't started!`, { autoClose: 2_000 });
      props.onClose();
      return;
    }
  }, [isFetchingMerkleProofs, isClaimedAlready, merkleProofs, props.onClose]);

  useEffect(() => {
    const handleClaim = async () => {
      if (claimed) {
        toast.success(`Claimed ${formatAmountWithSuffix(degenPoints.points)} Degen`, {
          autoClose: 2000
        });
        await delay(2000);
        navigate(0);
      } else if (isClaimError) {
        toast.error('Failed to claim points');
      }
    };

    handleClaim();
  }, [claimed, isClaimError, degenPoints.points, navigate]);

  async function handleClaimPoints() {
    if (!season.contract || !merkleProofs) {
      toast.error('Something went wrong!');
      return;
    }

    console.log('Claiming points', {
      index: BigInt(merkleProofs.index),
      wallet_address: merkleProofs.wallet_address,
      amount: BigInt(merkleProofs.amount),
      proof: merkleProofs.proof,
      seasonContract: season.contract
    });

    writeContract({
      abi: degenClaimAbi,
      address: season.contract,
      functionName: 'claim',
      args: [
        BigInt(merkleProofs.index),
        merkleProofs.wallet_address,
        BigInt(merkleProofs.amount),
        merkleProofs.proof
      ]
    });
  }

  return (
    <ResponsiveDialog
      title={`Degen Points: ${formatAmountWithSuffix(degenPoints.points)}`}
      open={props.open && !isClaimedAlready}
      onOpen={() => {}}
      onClose={props.onClose}>
      <Divider flexItem />
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="space-between">
        {!degenPoints.wallet_address ? (
          <>
            <Typography textAlign="center" color={red[400]} fontWeight="bold">
              Missing verified address linked to your farcaster!
            </Typography>
          </>
        ) : (
          <Stack width="100%" spacing={0.5} p={1} alignItems="flex-start" justifyContent="center">
            <Typography
              fontSize={16}
              fontWeight="bold"
              display="inline-flex"
              alignItems="center"
              color="text.secondary">
              Claim rewards with:{' '}
              <IoIosWallet fontSize="large" style={{ marginLeft: 4, marginRight: 2 }} />
              {shortenWalletAddressLabel2(degenPoints.wallet_address)}
            </Typography>
          </Stack>
        )}

        {isClaimCheckPending ||
        address?.toLowerCase() === degenPoints.wallet_address.toLowerCase() ? (
          !isClaimCheckPending && chainId !== season.chainId ? (
            <LoadingSwitchChainButton lazy={false} chainId={season.chainId} />
          ) : !isWalletNativeBalancePending && !hasEnoughNative ? (
            <Stack spacing={1} alignItems="center" width="100%">
              <Typography align="center" color="error" variant="subtitle2">
                Insufficient {season.chainId === base.id ? 'ETH' : 'DEGEN'} for gas fees <br />
                (min {season.chainId === base.id ? '0.0001 ETH' : '10 DEGEN'} required)
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate(`/payment/create?recipient=${degenPoints.wallet_address}`)}>
                Fund wallet with {season.chainId === base.id ? 'ETH' : 'DEGEN'}
              </Button>
            </Stack>
          ) : (
            <CustomLoadingButton
              title="Claim"
              disabled={!merkleProofs}
              loading={
                isFetchingMerkleProofs ||
                isClaimCheckPending ||
                isClaimPending ||
                isWalletNativeBalancePending
              }
              status={
                isFetchingMerkleProofs || isClaimCheckPending || isWalletNativeBalancePending
                  ? 'Checking'
                  : 'Claiming'
              }
              onClick={handleClaimPoints}
            />
          )
        ) : (
          <LoadingConnectWalletButton address={degenPoints.wallet_address.toLowerCase()} />
        )}
      </Box>
    </ResponsiveDialog>
  );
}
