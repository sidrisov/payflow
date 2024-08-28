import ResponsiveDialog, { ResponsiveDialogProps } from './ResponsiveDialog';
import { Box, Divider, Stack, Typography, useMediaQuery } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { LoadingPaymentButton } from '../buttons/LoadingPaymentButton';
import { ProfileContext } from '../../contexts/UserContext';
import { grey, red } from '@mui/material/colors';
import { FlowType } from '../../types/FlowType';
import { DegenPoints, useMerkleProofs } from '../../utils/queries/degen';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { toast } from 'react-toastify';

export function ClaimDegenPointsDialog({
  degenPoints,
  ...props
}: { degenPoints: DegenPoints } & ResponsiveDialogProps) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const { profile } = useContext(ProfileContext);

  const flows = profile?.flows?.filter((flow) => flow.type === 'FARCASTER_VERIFICATION');

  const [selectedFlow, setSelectedFlow] = useState<FlowType | undefined>(flows?.[0]);

  const {
    isFetching: isFetchingMerkleProofs,
    data: merkleProofs,
    error: merkleProofsError
  } = useMerkleProofs(degenPoints.wallet_address);

  useEffect(() => {
    if (merkleProofsError || (!isFetchingMerkleProofs && !merkleProofs)) {
      toast.warn("Season 7 Points claiming hasn't started!", { delay: 2_000, closeButton: false });
      props.onClose();
    }
  }, [isFetchingMerkleProofs, merkleProofs, props.onClose]);

  /* const { isFetching: isFetchingClaimStatus, data: claimStatus } = useMoxieRewardsClaimStatus(
    fid,
    claimResponse?.transactionId
  );

  async function handleClaimRewards() {
    const preferredConnectedWallet = selectedFlow?.wallets[0].address;
    if (preferredConnectedWallet) {
      claimRewards({ preferredConnectedWallet });
    }
  } */

  /* useEffect(() => {
    const handleClaimStatus = async () => {
      if (claimError) {
        toast.error(`${claimError.message}`, { autoClose: 2000 });
        return;
      }

      if (claimStatus) {
        if (claimStatus.status === 'SUCCESS') {
          toast.success(`Claimed ${normalizeNumberPrecision(claimStatus.rewards)} Moxie`, {
            autoClose: 2000
          });
          await delay(3000);
          navigate(0);
        } else {
          toast.error('Failed to claim rewards');
        }
      }
    };
    handleClaimStatus();
  }, [claimStatus, claimError]); */

  return (
    merkleProofs && (
      <ResponsiveDialog
        title={`Degen Points: ${degenPoints.points}`}
        open={props.open}
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
              <Typography fontSize={16} fontWeight="bold" color={grey[prefersDarkMode ? 400 : 700]}>
                Claim rewards with: {shortenWalletAddressLabel2(degenPoints.wallet_address)}
              </Typography>
            </Stack>
          )}
          <LoadingPaymentButton
            title="Claim"
            disabled={!selectedFlow}
            /*  loading={isClaiming || isFetchingClaimStatus} */
            status="Claiming"
            /*  onClick={handleClaimRewards} */
          />
        </Box>
      </ResponsiveDialog>
    )
  );
}
