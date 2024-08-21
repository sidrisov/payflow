import ResponsiveDialog, { ResponsiveDialogProps } from './ResponsiveDialog';
import { normalizeNumberPrecision } from '../../utils/formats';
import { Box, Button, Divider, Stack, Typography, useMediaQuery } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useClaimRewardsMutation, useMoxieRewardsClaimStatus } from '../../utils/queries/moxie';
import { LoadingPaymentButton } from '../buttons/LoadingPaymentButton';
import { ProfileContext } from '../../contexts/UserContext';
import { Check } from '@mui/icons-material';
import { grey, green, red } from '@mui/material/colors';
import { FlowType } from '../../types/FlowType';
import { PaymentFlowSection } from '../PaymentFlowSection';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { delay } from '../../utils/delay';

export function ClaimMoxieRewardsDialog({
  fid,
  claimableRewardsAmount,
  ...props
}: { fid: number; claimableRewardsAmount: number } & ResponsiveDialogProps) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const navigate = useNavigate();

  const { profile } = useContext(ProfileContext);

  const flows = profile?.flows?.filter((flow) => flow.type === 'FARCASTER_VERIFICATION');

  const [selectedFlow, setSelectedFlow] = useState<FlowType | undefined>(flows?.[0]);

  const {
    isPending: isClaiming,
    data: claimResponse,
    error: claimError,
    mutateAsync: claimRewards
  } = useClaimRewardsMutation();

  const { isFetching: isFetchingClaimStatus, data: claimStatus } = useMoxieRewardsClaimStatus(
    fid,
    claimResponse?.transactionId
  );

  async function handleClaimRewards() {
    const preferredConnectedWallet = selectedFlow?.wallets[0].address;
    if (fid && preferredConnectedWallet) {
      claimRewards({ fid, preferredConnectedWallet });
    }
  }

  useEffect(() => {
    const handleClaimStatus = async () => {
      if (claimError) {
        toast.error(`${claimError.message}`);
        return;
      }

      if (claimStatus) {
        if (claimStatus.status === 'SUCCESS') {
          toast.success(
            `Claimed ${normalizeNumberPrecision(claimStatus.rewards)} Moxie`
          );
          await delay(3000);
          navigate(0);
        } else {
          toast.error('Failed to claim rewards');
        }
      }
    };
    handleClaimStatus();
  }, [claimStatus, claimError]);

  return (
    <ResponsiveDialog
      title={`Moxie Rewards: ${normalizeNumberPrecision(claimableRewardsAmount)}`}
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
        {flows && flows.length === 0 && (
          <>
            <Typography textAlign="center" color={red[400]} fontWeight="bold">
              No verified address linked to your farcaster!
              <br />
              You need at least one to claim rewards
            </Typography>
          </>
        )}

        {selectedFlow && (
          <Stack width="100%" spacing={0.5} p={1} alignItems="flex-start" justifyContent="center">
            <Typography fontSize={16} fontWeight="bold" color={grey[prefersDarkMode ? 400 : 700]}>
              Claim rewards with a verified wallet:
            </Typography>
            {flows?.map((verification) => (
              <Stack
                pl={1}
                direction="row"
                spacing={1}
                alignItems="center"
                component={Button}
                textTransform="none"
                color="inherit"
                borderRadius={5}
                onClick={() => setSelectedFlow(verification)}>
                <Box display="flex" width={30}>
                  {verification.uuid === selectedFlow?.uuid && (
                    <Check sx={{ alignSelf: 'center', color: green[400] }} />
                  )}
                </Box>
                <PaymentFlowSection flow={verification} />
              </Stack>
            ))}
          </Stack>
        )}
        <LoadingPaymentButton
          title="Claim"
          disabled={!selectedFlow}
          loading={isClaiming || isFetchingClaimStatus}
          status="Claiming"
          onClick={handleClaimRewards}
        />
      </Box>
    </ResponsiveDialog>
  );
}
