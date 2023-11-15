import { Avatar, Box, IconButton, Tooltip, Typography } from '@mui/material';
import { FlagOutlined, ContentCopy } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { copyToClipboard } from '../utils/copyToClipboard';
import { shortenWalletAddressLabel } from '../utils/address';
import { SafeWalletType } from '../types/FlowType';
import { shortNetworkName } from '../utils/shortNetworkName';
import NetworkAvatar from './NetworkAvatar';

export function WalletSection(props: { wallet: SafeWalletType; balance?: string }) {
  const { wallet, balance } = props;

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      minWidth={250}
      justifyContent="space-between"
      sx={{ border: 1, borderRadius: 5, p: 1 }}>
      <Box display="flex" flexDirection="row" alignItems="center">
        <NetworkAvatar tooltip network={wallet.network} sx={{ width: 24, height: 24 }} />
        <Typography ml={1}>{shortenWalletAddressLabel(wallet.address)}</Typography>
        <Tooltip title="Copy Address">
          <IconButton
            size="small"
            onClick={() => {
              copyToClipboard(wallet.address);
              toast.success('Address is copied!');
            }}>
            <ContentCopy fontSize="small" />
          </IconButton>
        </Tooltip>
        {wallet.safe && (
          <>
            <Tooltip title="Open in Safe Web Wallet">
              <a
                href={`https://app.safe.global/home?safe=${shortNetworkName(wallet.network)}:${
                  wallet.address
                }`}
                target="_blank">
                <Avatar src="/safe.png" sx={{ width: 16, height: 16 }} />
              </a>
            </Tooltip>
            {!wallet.safeDeployed && (
              <Tooltip title="Wallet will be initialized on the first transaction!">
                <FlagOutlined sx={{}} fontSize="small" />
              </Tooltip>
            )}
          </>
        )}
      </Box>
      {balance && <Typography variant="subtitle2">${balance}</Typography>}
    </Box>
  );
}
