import { Avatar, Box, Tooltip, Typography } from '@mui/material';
import { FlagOutlined } from '@mui/icons-material';
import { shortenWalletAddressLabel2 } from '../utils/address';
import { FlowWalletType } from '@payflow/common';
import { shortNetworkName } from '../utils/networks';
import NetworkAvatar from './avatars/NetworkAvatar';
import CopyToClipboardIconButton from './buttons/CopyToClipboardIconButton';

// TODO: for now since we have only safe wallets check version field to display safe indicator
export function WalletSection(props: { wallet: FlowWalletType; balance?: string }) {
  const { wallet, balance } = props;

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      minWidth={250}
      justifyContent="space-between"
      sx={{ border: 1, borderRadius: 4, borderColor: 'divider', p: 1 }}>
      <Box display="flex" flexDirection="row" alignItems="center">
        <NetworkAvatar tooltip chainId={wallet.network} sx={{ width: 24, height: 24 }} />
        <Typography ml={1}>{shortenWalletAddressLabel2(wallet.address)}</Typography>
        <CopyToClipboardIconButton iconSize={16} tooltip="Copy address" value={wallet.address} />
        {wallet.version && (
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
            {!wallet.deployed && (
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
