import {
  Avatar,
  Box,
  Card,
  CardProps,
  Divider,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import { cardBorderColours, ethPrice, networks } from '../utils/constants';
import { AccountType } from '../types/AccountType';
import { shortenWalletAddressLabel } from '../utils/address';
import { Receipt, ContentCopy, ArrowDownward, Send, SwapHoriz } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { copyToClipboard } from '../utils/copyToClipboard';
import { useState } from 'react';
import AddressQRCodeDialog from './AddressQRCodeDialog';
import { useBalance, useNetwork } from 'wagmi';
import { convertToUSD } from '../utils/getBalance';
import AccountSendDialog from './AccountSendDialog';

export type AccountNewDialogProps = CardProps & {
  account: AccountType;
};

const colorTheme = cardBorderColours[(cardBorderColours.length * Math.random()) | 0];

export function AccountCard(props: AccountNewDialogProps) {
  const { account } = props;
  const [openAddressQRCode, setOpenAddressQRCode] = useState(false);
  const [openWithdrawalDialog, setOpenWithdrawalDialog] = useState(false);
  const { chains } = useNetwork();
  const { isSuccess, data: balance } = useBalance({
    address: account.address,
    chainId: chains.find((c) => c?.name === account.network)?.id
  });

  const networkShortName = networks.find(
    (n) => n.chainId === chains.find((c) => c.name === account.network)?.id
  )?.shortName;

  return (
    <Card
      elevation={10}
      sx={{
        m: 2,
        p: 2,
        width: 350,
        height: 200,
        border: 2,
        borderRadius: 5,
        borderColor: colorTheme,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
      <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={1} direction="row" alignItems="center">
          <Avatar src={'/networks/' + account.network + '.png'} sx={{ width: 36, height: 36 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 'bold' }}>{account.network}</Typography>
        </Stack>

        <Stack spacing={1} direction="row" alignItems="center">
          {account.safe && (
            <a
              href={`https://app.safe.global/home?safe=${networkShortName}:${account.address}`}
              target="_blank">
              <Avatar src="/safe.png" sx={{ width: 16, height: 16 }} />
            </a>
          )}
          <Typography sx={{ fontSize: 15, fontWeight: 'bold' }}>
            {shortenWalletAddressLabel(account.address)}
          </Typography>
          <IconButton
            size="small"
            color="inherit"
            onClick={() => {
              copyToClipboard(account.address);
              toast.success('Wallet address is copied to clipboard!');
            }}>
            <ContentCopy fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
      <Divider
        flexItem
        sx={{
          '&::before, &::after': {
            borderColor: 'inherit'
          }
        }}>
        <Box
          sx={{
            p: 1,
            border: 1,
            borderRadius: 3
          }}>
          <Typography variant="h5">
            ${isSuccess ? convertToUSD(balance?.value, ethPrice) : ''} 💸
          </Typography>
        </Box>
      </Divider>
      <Stack spacing={2} direction="row" alignSelf="center">
        <IconButton
          color="inherit"
          onClick={() => {
            toast.error('Feature not supported yet!');
          }}
          sx={{ border: 1, borderStyle: 'dashed' }}>
          <ArrowDownward />
        </IconButton>
        <IconButton
          color="inherit"
          onClick={async () => {
            setOpenWithdrawalDialog(true);
          }}
          sx={{ border: 1, borderStyle: 'dashed' }}>
          <Send />
        </IconButton>
        <IconButton
          color="inherit"
          onClick={() => {
            toast.error('Feature not supported yet!');
          }}
          sx={{ border: 1, borderStyle: 'dashed' }}>
          <SwapHoriz />
        </IconButton>
        <IconButton
          color="inherit"
          onClick={() => {
            toast.error('Feature not supported yet!');
          }}
          sx={{ border: 1, borderStyle: 'dashed' }}>
          <Receipt />
        </IconButton>
      </Stack>
      <AddressQRCodeDialog
        open={openAddressQRCode}
        address={account.address}
        network={account.network}
        closeStateCallback={() => setOpenAddressQRCode(false)}
      />
      <AccountSendDialog
        open={openWithdrawalDialog}
        from={account.address}
        network={account.network}
        closeStateCallback={async () => setOpenWithdrawalDialog(false)}
      />
    </Card>
  );
}
