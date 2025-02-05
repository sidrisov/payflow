import {
  Dialog,
  DialogContent,
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
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { useEffect, useState } from 'react';
import { ChooseWalletMenu } from '../menu/ChooseWalletMenu';
import { FlowWalletType } from '@payflow/common';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { getNetworkDisplayName } from '../../utils/networks';
import { useMobile } from '../../utils/hooks/useMobile';
import { useAccount } from 'wagmi';

export type WalletQRCodeShareDialogProps = DialogProps &
  CloseCallbackType & {
    wallets: FlowWalletType[];
  };

export default function WalletQRCodeShareDialog({
  wallets,
  closeStateCallback,
  ...props
}: WalletQRCodeShareDialogProps) {
  const isMobile = useMobile();

  const { chain } = useAccount();

  const [openSelectWallet, setOpenSelectWallet] = useState(false);
  const [walletAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);

  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType | undefined>();
  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  useEffect(() => {
    setSelectedWallet(wallets.find((w) => w.network === chain?.id) ?? wallets[0]);
  }, [wallets, chain]);

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
          backdropFilter: 'blur(3px)'
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
                {shortenWalletAddressLabel2(selectedWallet.address)}
              </Typography>
              <Tooltip title="Copy Address">
                <IconButton
                  size="small"
                  onClick={() => {
                    copyToClipboard(selectedWallet.address, 'Address copied!');
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
