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
  TextField
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';

export default function PaymentFrameComposerDialog({
  closeStateCallback,
  ...props
}: DialogProps & CloseCallbackType) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [searchParams] = useSearchParams();
  const identity = searchParams.get('identity');

  const [paymentFrameTitle, setPaymentFrameTitle] = useState<string>('👋🏻 Pay Me');

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
        </Stack>
        <Button
          variant="outlined"
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
                        `https://frames.payflow.me/${identity}?entryTitle=${encodeURIComponent(
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
