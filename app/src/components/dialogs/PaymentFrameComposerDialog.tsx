import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogProps,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  Button,
  Stack,
  TextField,
  Badge
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { ArrowRight, Check, Verified } from '@mui/icons-material';
import { green, grey, red } from '@mui/material/colors';

export default function PaymentFrameComposerDialog({
  closeStateCallback,
  ...props
}: DialogProps & CloseCallbackType) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [searchParams] = useSearchParams();
  const verifications = searchParams.getAll('verifications') ?? [];
  const title = searchParams.get('title') ?? '👋🏻 Pay Me';
  const [paymentFrameTitle, setPaymentFrameTitle] = useState<string>(title);
  const [selectedVerification, setSelectedVerification] = useState<string>(verifications?.[0]);
  const [openVerificationSelector, setOpenVerificationSelector] = useState(false);

  return (
    <Dialog
      fullScreen={isMobile}
      {...props}
      PaperProps={{
        sx: {
          ...(!isMobile && {
            borderRadius: 5
          }),
          minWidth: 350
        }
      }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Box display="flex" justifyContent="center">
          <Typography variant="h6" sx={{ overflow: 'auto' }}>
            New Payment Frame
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: isMobile ? 'space-between' : 'flex-start'
        }}>
        <Stack my={3} direction="column" spacing={3} width="100%">
          <TextField
            fullWidth
            value={paymentFrameTitle}
            label="Payment Title"
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

          {verifications.length === 0 && (
            <>
              <Typography textAlign="center" color={red[400]} fontWeight="bold">
                No verified address linked to your farcaster!
                <br />
                You need at least one to receive payments
              </Typography>

              <Typography textAlign="center" color={green[400]} fontWeight="bold">
                Verify in Warpcast:
                <br />
                {'Settings -> Verified Addresses -> Verify an address'}
              </Typography>
            </>
          )}

          {verifications.length > 0 && !openVerificationSelector && (
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
              <Stack direction="row" spacing={1}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={<Verified sx={{ width: 15, height: 15 }} />}>
                  <Box src="/farcaster.svg" component="img" sx={{ width: 20, height: 20 }} />
                </Badge>
                <Typography>
                  {`Verification: ${shortenWalletAddressLabel2(selectedVerification)}`}
                </Typography>
              </Stack>
              <ArrowRight fontSize="small" />
            </Button>
          )}
          {openVerificationSelector && (
            <Stack spacing={0.5} p={1} alignItems="flex-start" justifyContent="center">
              <Typography fontSize={16} color={grey[400]}>
                Receive payments on:
              </Typography>
              {verifications?.map((verification) => (
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
                    setSelectedVerification(verification);
                    setOpenVerificationSelector(false);
                  }}>
                  <Box display="inline" width={30}>
                    {verification === selectedVerification && <Check sx={{ color: green[400] }} />}
                  </Box>
                  <Typography>{shortenWalletAddressLabel2(verification)}</Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
        <Button
          variant="outlined"
          disabled={!selectedVerification}
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
                    text: 'Created a custom payment frame to receive donations for `...`',
                    embeds: [
                      encodeURI(
                        `https://frames.payflow.me/${selectedVerification}?entryTitle=${encodeURIComponent(
                          paymentFrameTitle
                        )}`
                      )
                    ]
                  }
                }
              },
              '*'
            );
          }}>
          Create
        </Button>
      </DialogContent>
    </Dialog>
  );
}
