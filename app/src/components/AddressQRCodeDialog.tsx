import { Dialog, DialogContent, useMediaQuery, useTheme, DialogProps } from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import QRCode from 'react-qr-code';

export type AddressQRCodeDialogProps = DialogProps &
  CloseCallbackType & {
    address: string | undefined;
    network: string | undefined;
  };

export default function AddressQRCodeDialog({
  closeStateCallback,
  ...props
}: AddressQRCodeDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      onClose={handleCloseCampaignDialog}
      {...props}
      PaperProps={{ sx: { borderRadius: 5 } }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogContent>{props.address && <QRCode value={props.address} />}</DialogContent>
    </Dialog>
  );
}
