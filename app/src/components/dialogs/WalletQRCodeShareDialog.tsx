import {
  Dialog,
  DialogContent,
  useMediaQuery,
  useTheme,
  DialogProps,
  DialogTitle,
  Stack,
  Typography,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import QRCode from 'react-qr-code';
import { ArrowBack, ContentCopy } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { shortenWalletAddressLabel } from '../../utils/address';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { useState } from 'react';
import { ChooseWalletMenu } from '../menu/ChooseWalletMenu';
import { FlowWalletType } from '../../types/FlowType';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { getNetworkDisplayName, shortNetworkName } from '../../utils/networks';

export type WalletQRCodeShareDialogProps = DialogProps &
  CloseCallbackType & {
    wallet: FlowWalletType;
    wallets: FlowWalletType[];
  };

export default function WalletQRCodeShareDialog({
  wallet,
  wallets,
  closeStateCallback,
  ...props
}: WalletQRCodeShareDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [openSelectWallet, setOpenSelectWallet] = useState(false);
  const [walletAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);

  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType | undefined>(wallet);
  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  return (
    selectedWallet && (
      <Dialog
        fullScreen={isMobile}
        onClose={handleCloseCampaignDialog}
        {...props}
        PaperProps={{
          sx: {
            ...(!isMobile && {
              borderRadius: 5
            })
          }
        }}
        sx={{
          backdropFilter: 'blur(5px)'
        }}>
        <DialogTitle>
          {isMobile && (
            <IconButton onClick={closeStateCallback}>
              <ArrowBack />
            </IconButton>
          )}
          <Typography textAlign="center" variant="subtitle2">
            Send only on{' '}
            <b>
              <u>{getNetworkDisplayName(selectedWallet.network)}</u>
            </b>{' '}
            network
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack alignItems="center" spacing={2}>
            <Box display="flex" flexDirection="row" alignItems="center">
              <IconButton
                sx={{ width: 40, height: 40, border: 1, borderStyle: 'dashed' }}
                onClick={(event) => {
                  setWalletAnchorEl(event.currentTarget);
                  setOpenSelectWallet(true);
                }}>
                <NetworkAvatar
                  tooltip
                  chainId={selectedWallet.network}
                  sx={{ width: 28, height: 28 }}
                />
              </IconButton>
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
              value={`${selectedWallet.address}`}
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
    )
  );
}
