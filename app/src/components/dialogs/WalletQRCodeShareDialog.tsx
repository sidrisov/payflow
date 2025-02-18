import { Stack, Typography, Box } from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import QRCode from 'react-qr-code';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { FlowWalletType } from '@payflow/common';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { getNetworkDisplayName } from '../../utils/networks';
import CopyToClipboardIconButton from '../buttons/CopyToClipboardIconButton';
import ResponsiveDialog from './ResponsiveDialog';

export type WalletQRCodeShareDialogProps = CloseCallbackType & {
  open: boolean;
  wallets: FlowWalletType[];
};

export default function WalletQRCodeShareDialog({
  open,
  wallets,
  closeStateCallback
}: WalletQRCodeShareDialogProps) {
  return (
    <ResponsiveDialog open={open} onClose={closeStateCallback} title="Deposit with QR or Address">
      <Stack alignItems="center" spacing={1} p={1}>
        <QRCode
          value={`${wallets[0].address}`}
          style={{ borderRadius: 10, border: 5, borderStyle: 'double' }}
        />
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          width="100%">
          <Typography variant="subtitle2">
            Copy Address: {shortenWalletAddressLabel2(wallets[0].address)}
          </Typography>
          <CopyToClipboardIconButton
            iconSize={18}
            value={wallets[0].address}
            tooltip="Copy Address"
          />
        </Box>
        <Typography
          p={1}
          variant="subtitle2"
          fontWeight="bold"
          textAlign="center"
          sx={{ color: 'warning.main', border: 1, borderRadius: '16px' }}>
          Note: Deposit only on the following networks!
        </Typography>
        <Stack direction="row" flexWrap="wrap" alignItems="center" justifyContent="center" gap={1}>
          {wallets.map((wallet) => (
            <Box
              key={wallet.network}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                p: 1,
                minWidth: 80
              }}>
              <NetworkAvatar chainId={wallet.network} sx={{ width: 32, height: 32 }} />
              <Typography variant="caption">{getNetworkDisplayName(wallet.network)}</Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </ResponsiveDialog>
  );
}
