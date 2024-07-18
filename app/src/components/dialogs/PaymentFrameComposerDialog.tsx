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
  Stack
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useSearchParams } from 'react-router-dom';

export default function PaymentFrameComposerDialog({
  closeStateCallback,
  ...props
}: DialogProps & CloseCallbackType) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [searchParams] = useSearchParams();
  const identity = searchParams.get('identity');

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
        <Stack my={3} p={1} direction="column" spacing={3} width="100%"></Stack>
        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          size="large"
          sx={{ borderRadius: 5 }}
          onClick={async () => {
            parent.postMessage({
              type: 'createCast',
              data: {
                cast: {
                  text: 'Accepting payments here',
                  embeds: [`https://frames.payflow.me/${identity}`]
                }
              }
            });
          }}>
          Create
        </Button>
      </DialogContent>
    </Dialog>
  );
}
