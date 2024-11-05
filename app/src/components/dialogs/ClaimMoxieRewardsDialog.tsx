import ResponsiveDialog, { ResponsiveDialogProps } from './ResponsiveDialog';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { Box, Button, Divider, Stack, Typography, Card } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useClaimRewardsMutation, useMoxieRewardsClaimStatus } from '../../utils/queries/moxie';
import { CustomLoadingButton } from '../buttons/LoadingPaymentButton';
import { ProfileContext } from '../../contexts/UserContext';
import { Check } from '@mui/icons-material';
import { green, red } from '@mui/material/colors';
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

  const {
    isFetching: isFetchingClaimStatus,
    data: claimStatus,
    error: claimStatusError
  } = useMoxieRewardsClaimStatus(fid, claimResponse?.transactionId);

  const [countdown, setCountdown] = useState(59);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isClaiming || isFetchingClaimStatus) {
      timer = setInterval(() => {
        setCountdown((prevCountdown) => (prevCountdown > 0 ? prevCountdown - 1 : 0));
      }, 1000);
    } else {
      setCountdown(59);
    }
    return () => clearInterval(timer);
  }, [isClaiming, isFetchingClaimStatus]);

  const isAlreadyClaimed = claimError?.message === 'No pending rewards for claim';

  async function handleClaimRewards() {
    const preferredConnectedWallet = selectedFlow?.wallets[0].address;
    if (fid && preferredConnectedWallet) {
      claimRewards({ fid, preferredConnectedWallet });
    }
  }

  useEffect(() => {
    const handleClaimStatus = async () => {
      if (isAlreadyClaimed) {
        toast.success('Claimed already!', {
          autoClose: 2000
        });
        props.onClose?.();
        return;
      }

      if (
        (claimError && claimError?.message !== 'No pending rewards for claim') ||
        claimStatusError
      ) {
        toast.error(
          `Failed to claim rewards: ${claimError?.message || claimStatusError?.message}`,
          { autoClose: 2000 }
        );
        props.onClose?.();
        return;
      }

      if (claimStatus) {
        if (claimStatus.status === 'SUCCESS') {
          toast.success(
            `Claimed ${formatAmountWithSuffix(
              normalizeNumberPrecision(claimStatus.rewards)
            )} Moxie`,
            {
              autoClose: 2000
            }
          );
          await delay(3000);
          navigate(0);
        } else {
          toast.error('Failed to claim rewards');
        }
      }
    };
    handleClaimStatus();
  }, [claimStatus, claimError, claimStatusError, isAlreadyClaimed]);

  return (
    <ResponsiveDialog
      title={`Moxie Rewards: ${formatAmountWithSuffix(
        normalizeNumberPrecision(claimableRewardsAmount)
      )}`}
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
        {isFetchingClaimStatus ? (
          <Card
            elevation={15}
            sx={{
              p: 1,
              m: 2,
              borderRadius: 3
            }}>
            <Typography variant="body1" color="text.primary" paragraph>
              Your claim for{' '}
              <Box component="span" fontWeight="bold" color="text.primary">
                {formatAmountWithSuffix(normalizeNumberPrecision(claimableRewardsAmount))} Moxie
              </Box>{' '}
              has been submitted!
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This process can take up to a minute. You can wait here for confirmation or close this
              dialog and check your total claimed balance later.
            </Typography>
            <Typography variant="body2" fontStyle="italic">
              Thank you for your patience!
            </Typography>
          </Card>
        ) : (
          <>
            {flows && flows.length === 0 && (
              <Typography textAlign="center" color={red[400]} fontWeight="bold">
                No verified address linked to your farcaster!
                <br />
                You need at least one to claim rewards
              </Typography>
            )}

            {selectedFlow && (
              <Stack
                width="100%"
                spacing={0.5}
                p={1}
                alignItems="flex-start"
                justifyContent="center">
                <Typography fontSize={16} fontWeight="bold" color="text.secondary">
                  Claim rewards with a verified wallet:
                </Typography>
                {flows?.map((verification) => (
                  <Stack
                    key={verification.uuid}
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
          </>
        )}
        <CustomLoadingButton
          title="Claim"
          disabled={!selectedFlow || countdown === 0}
          loading={isClaiming || isFetchingClaimStatus}
          status={`Claiming (${countdown})`}
          onClick={handleClaimRewards}
        />
      </Box>
    </ResponsiveDialog>
  );
}
