import { Avatar, Box, IconButton, Tooltip, Typography } from '@mui/material';
import { FlagOutlined, ContentCopy } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { copyToClipboard } from '../utils/copyToClipboard';
import { shortenWalletAddressLabel } from '../utils/address';
import { WalletType } from '../types/FlowType';
import { shortNetworkName } from '../utils/shortNetworkName';

export function WalletSection(props: { wallet: WalletType; balance: string }) {
  const { wallet, balance } = props;

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      minWidth={250}
      justifyContent="space-between"
      sx={{ border: 1, borderRadius: 3, p: 1 }}>
      <Box display="flex" flexDirection="row" alignItems="center">
        <Tooltip title={wallet.network}>
          <Avatar src={'/networks/' + wallet.network + '.png'} sx={{ width: 24, height: 24 }} />
        </Tooltip>
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
              <Tooltip title="Wallet will be initialized on the first withdrawal!">
                <FlagOutlined sx={{}} fontSize="small" />
              </Tooltip>
            )}
          </>
        )}
      </Box>
      <Typography variant="subtitle2">${balance}</Typography>
    </Box>
  );
}
