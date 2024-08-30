import ResponsiveDialog, { ResponsiveDialogProps } from './ResponsiveDialog';
import { Box, Divider, Stack, Typography, useMediaQuery } from '@mui/material';
import { useEffect } from 'react';
import { CustomLoadingButton } from '../buttons/LoadingPaymentButton';
import { grey, red } from '@mui/material/colors';
import { DegenClaimSeason, DegenPoints, useMerkleProofs } from '../../utils/queries/degen';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { toast } from 'react-toastify';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { LoadingConnectWalletButton } from '../buttons/LoadingConnectWalletButton';
import { LoadingSwitchChainButton } from '../buttons/LoadingSwitchNetworkButton';
import { IoIosWallet } from 'react-icons/io';
import { degenClaimAbi } from '../../utils/abi/degenClaimAbi';
import { delay } from '../../utils/delay';
import { useNavigate } from 'react-router-dom';
import { formatAmountWithSuffix } from '../../utils/formats';

export function ClaimDegenPointsDialog({
  degenPoints,
  season,
  ...props
}: { degenPoints: DegenPoints; season: DegenClaimSeason } & ResponsiveDialogProps) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const { address, chainId } = useAccount();
  const navigate = useNavigate();

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
    if (claimed) {
      toast.success(`Claimed ${formatAmountWithSuffix(degenPoints.points)} Degen`, {
        autoClose: 2000
      });
      delay(3000);
      navigate(0);
    } else if (isClaimError) {
      toast.error('Failed to claim points');
    }
  }, [claimed, isClaimError]);

  async function handleClaimPoints() {
    if (!season.contract || !merkleProofs) {
      toast.error('Something went wrong!');
      return;
    }
    writeContract({
      abi: degenClaimAbi,
      address: season.contract,
      functionName: 'claim',
      args: [
        merkleProofs.index,
        merkleProofs.wallet_address,
        merkleProofs.amount,
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
              color={grey[prefersDarkMode ? 400 : 700]}>
              Claim rewards with:{' '}
              <IoIosWallet fontSize="large" style={{ marginLeft: 4, marginRight: 2 }} />
              {shortenWalletAddressLabel2(degenPoints.wallet_address)}
            </Typography>
          </Stack>
        )}

        {isClaimCheckPending ||
        address?.toLowerCase() === degenPoints.wallet_address.toLowerCase() ? (
          !isClaimCheckPending && chainId !== season.chainId ? (
            <LoadingSwitchChainButton chainId={season.chainId} />
          ) : (
            <CustomLoadingButton
              title="Claim"
              disabled={!merkleProofs}
              loading={isFetchingMerkleProofs || isClaimCheckPending || isClaimPending}
              status={isFetchingMerkleProofs || isClaimCheckPending ? 'Checking' : 'Claiming'}
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
