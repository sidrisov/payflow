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

export type FlowShareDialogProps = DialogProps &
  CloseCallbackType & {
    title: string;
    link: string;
  };

export default function FlowShareDialog({ closeStateCallback, ...props }: FlowShareDialogProps) {
  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  return props.title ? (
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
            {props.title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
        <Stack m={1} direction="column" spacing={3}>
          <Chip
            icon={<Link />}
            label={props.link?.replace(/^https?:\/\//, '')}
            clickable
            onClick={() => {
              copyToClipboard(props.link);
              toast.success('Link is copied!');
            }}
            sx={{
              alignSelf: 'center',
              textOverflow: 'ellipsis'
            }}
          />
          {props.link && (
            <QRCode alignmentBaseline="central" alphabetic="true" value={props.link} />
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  ) : (
    <></>
  );
}
