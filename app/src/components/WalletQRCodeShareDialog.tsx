import {
  Dialog,
  DialogContent,
  useMediaQuery,
  useTheme,
  DialogProps,
  DialogTitle,
  Stack,
  Typography,
  Avatar,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import QRCode from 'react-qr-code';
import { ContentCopy } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { shortenWalletAddressLabel } from '../utils/address';
import { copyToClipboard } from '../utils/copyToClipboard';
import { useState } from 'react';
import { ChooseWalletMenu } from './ChooseWalletMenu';
import { FlowWalletType } from '../types/FlowType';
import getNetworkImageSrc from '../utils/networkImages';

export type WalletQRCodeShareDialogProps = DialogProps &
  CloseCallbackType & {
    wallet: FlowWalletType;
    wallets: FlowWalletType[];
  };

export default function WalletQRCodeShareDialog({
  closeStateCallback,
  ...props
}: WalletQRCodeShareDialogProps) {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { wallet, wallets } = props;

  const [openSelectWallet, setOpenSelectWallet] = useState(false);
  const [walletAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);

  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>(wallet);
  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  return (
    <Dialog
      fullScreen={smallScreen}
      onClose={handleCloseCampaignDialog}
      {...props}
      PaperProps={{ sx: { borderRadius: 5 } }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Typography textAlign="center" variant="subtitle2">
          Send only on{' '}
          <b>
            <u>{selectedWallet.network}</u>
          </b>{' '}
          network
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack alignItems="center" spacing={2}>
          <Box display="flex" flexDirection="row" alignItems="center">
            <Tooltip title={selectedWallet.network}>
              <IconButton
                sx={{ width: 40, height: 40, border: 1, borderStyle: 'dashed' }}
                onClick={(event) => {
                  setWalletAnchorEl(event.currentTarget);
                  setOpenSelectWallet(true);
                }}>
                <Avatar
                  src={getNetworkImageSrc(selectedWallet.network)}
                  sx={{ width: 28, height: 28 }}
                />
              </IconButton>
            </Tooltip>
            <Typography ml={1} variant="subtitle2">
              {shortenWalletAddressLabel(selectedWallet.address)}
            </Typography>
            <Tooltip title="Copy Address">
              <IconButton
                size="small"
                onClick={() => {
                  copyToClipboard(selectedWallet.address);
                  toast.success('Address is copied!');
                }}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <QRCode
            value={selectedWallet.address}
            style={{ borderRadius: 10, border: 5, borderStyle: 'double' }}
          />
        </Stack>
      </DialogContent>
      <ChooseWalletMenu
        anchorEl={walletAnchorEl}
        open={openSelectWallet}
        closeStateCallback={() => {
          setOpenSelectWallet(false);
        }}
        wallets={wallets}
        selectedWallet={selectedWallet}
        setSelectedWallet={setSelectedWallet}
      />
    </Dialog>
  );
}
