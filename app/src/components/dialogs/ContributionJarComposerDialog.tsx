import {
  Dialog,
  DialogContent,
  DialogProps,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  Button,
  Stack,
  TextField
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useSearchParams } from 'react-router-dom';
import { useContext, useState } from 'react';
import { ArrowRight, Check } from '@mui/icons-material';
import { green, grey, red } from '@mui/material/colors';
import { BackDialogTitle } from './BackDialogTitle';
import { ProfileContext } from '../../contexts/UserContext';
import { PaymentFlowSection } from '../PaymentFlowSection';
import { FlowType } from '../../types/FlowType';

export default function ContributionJarComposerDialog({
  closeStateCallback,
  ...props
}: DialogProps & CloseCallbackType) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { profile } = useContext(ProfileContext);

  const [searchParams] = useSearchParams();
  const title = searchParams.get('title') ?? '🍯 My contribution jar';
  const [jarTitle, setPaymentFrameTitle] = useState<string>(title);

  const flows = profile?.flows?.filter((flow) => flow.type === 'FARCASTER_VERIFICATION');

  const [selectedFlow, setSelectedFlow] = useState<FlowType | undefined>(flows?.[0]);
  const [openVerificationSelector, setOpenVerificationSelector] = useState(false);

  return (
    <Dialog
      disableEnforceFocus
      fullScreen={isMobile}
      onClose={closeStateCallback}
      {...props}
      PaperProps={{
        sx: {
          ...(!isMobile && {
            width: 375,
            borderRadius: 5,
            height: 600
          })
        }
      }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <BackDialogTitle title="Jar" closeStateCallback={closeStateCallback} hidden={true} />
      <DialogContent
        sx={{
          p: 2
        }}>
        <Box
          height="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="space-between">
          <Stack my={3} direction="column" spacing={3} width="100%">
            <TextField
              fullWidth
              value={jarTitle}
              label="Title"
              InputLabelProps={{
                sx: { fontSize: 16 }
              }}
              InputProps={{
                inputProps: { maxLength: 24, inputMode: 'text' },
                sx: { borderRadius: 5, fontSize: 16 }
              }}
              onChange={async (event) => {
                setPaymentFrameTitle(event.target.value);
              }}
            />

            {flows && flows.length === 0 && (
              <>
                <Typography textAlign="center" color={red[400]} fontWeight="bold">
                  No verified address linked to your farcaster!
                  <br />
                  You need at least one to receive contribution
                </Typography>

                <Typography textAlign="center" color={green[400]} fontWeight="bold">
                  Verify in Warpcast:
                  <br />
                  {'Settings -> Verified Addresses -> Verify an address'}
                </Typography>
              </>
            )}

            {flows && flows.length > 0 && !openVerificationSelector && selectedFlow && (
              <Button
                color="inherit"
                sx={{
                  height: 56,
                  textTransform: 'none',
                  borderRadius: 5,
                  border: 1,
                  px: 2,
                  justifyContent: 'space-between'
                }}
                onClick={async () => {
                  setOpenVerificationSelector(!openVerificationSelector);
                }}>
                <PaymentFlowSection flow={selectedFlow} />
                <ArrowRight fontSize="small" />
              </Button>
            )}
            {openVerificationSelector && (
              <Stack spacing={0.5} p={1} alignItems="flex-start" justifyContent="center">
                <Typography fontSize={16} color={grey[400]}>
                  Receive contributions on:
                </Typography>
                {flows?.map((verification) => (
                  <Stack
                    pl={1}
                    pr={3}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    component={Button}
                    textTransform="none"
                    color="inherit"
                    borderRadius={5}
                    onClick={async () => {
                      setSelectedFlow(verification);
                      setOpenVerificationSelector(false);
                    }}>
                    <Box display="inline" width={30}>
                      {verification.uuid === selectedFlow?.uuid && (
                        <Check sx={{ color: green[400] }} />
                      )}
                    </Box>
                    <PaymentFlowSection flow={verification} />
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
          <Button
            variant="outlined"
            disabled={!selectedFlow}
            color="inherit"
            fullWidth
            size="large"
            sx={{ borderRadius: 5 }}
            onClick={() => {
              window.parent.postMessage(
                {
                  type: 'createCast',
                  data: {
                    cast: {
                      text: `Created contribution jar: "${jarTitle}" using @payflow composer action 💜💜💜`,
                      embeds: [
                        encodeURI(
                          `https://frames.payflow.me/${
                            selectedFlow?.uuid
                          }?entryTitle=${encodeURIComponent(jarTitle)}`
                        )
                      ]
                    }
                  }
                },
                '*'
              );
            }}>
            Create Jar
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
