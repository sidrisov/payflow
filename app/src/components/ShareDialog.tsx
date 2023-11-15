import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogProps,
  Stack,
  Chip,
  Typography,
  Box
} from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import QRCode from 'react-qr-code';
import { Link } from '@mui/icons-material';
import { copyToClipboard } from '../utils/copyToClipboard';
import { toast } from 'react-toastify';

export type ShareDialogProps = DialogProps &
  CloseCallbackType & {
    title: string;
    link: string;
  };

export default function ShareDialog({
  title,
  link,
  closeStateCallback,
  ...props
}: ShareDialogProps) {
  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  return (
    <Dialog
      onClose={handleCloseCampaignDialog}
      {...props}
      PaperProps={{ sx: { borderRadius: 5 } }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Box display="flex" justifyContent="center">
          <Typography variant="h6" sx={{ overflow: 'auto' }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
        <Stack m={1} direction="column" spacing={3}>
          <Chip
            icon={<Link />}
            label={link?.replace(/^https?:\/\//, '')}
            clickable
            onClick={() => {
              copyToClipboard(link);
              toast.success('Link is copied!');
            }}
            sx={{
              alignSelf: 'center',
              textOverflow: 'ellipsis'
            }}
          />
          {link && <QRCode alignmentBaseline="central" alphabetic="true" value={link} />}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
