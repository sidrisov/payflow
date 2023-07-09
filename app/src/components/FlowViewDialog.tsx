import {
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  useTheme,
  DialogProps,
  Typography,
  Stack,
  Divider,
  Avatar,
  Box,
  IconButton
} from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { FlowType } from '../types/FlowType';
import { useMemo, useState } from 'react';
import { getTotalBalance, getWalletBalance } from '../utils/getFlowBalance';
import { useNetwork } from 'wagmi';
import { ContentCopy } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { shortenWalletAddressLabel } from '../utils/address';
import { copyToClipboard } from '../utils/copyToClipboard';
import { formatEther } from 'viem';

export type FlowViewDialogProps = DialogProps &
  CloseCallbackType & {
    flow: FlowType;
  };

export default function FlowViewDialog({ closeStateCallback, ...props }: FlowViewDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { chains } = useNetwork();

  const flow = props.flow;

  const [flowTotalBalance, setFlowTotalBalance] = useState('0');
  const [walletBalances, setWalletBalances] = useState([] as string[]);

  useMemo(async () => {
    if (flow && flow.wallets && flow.wallets.length) {
      const balances = (
        await Promise.all(
          flow.wallets.map(async (wallet) => {
            return getWalletBalance(wallet, chains);
          })
        )
      ).map((result) => result.value);

      setWalletBalances(
        balances.map((balance) => (parseFloat(formatEther(balance)) * 1850).toFixed(1))
      );

      setFlowTotalBalance(
        (parseFloat(formatEther(await getTotalBalance(balances))) * 1850).toFixed(1)
      );
    }
  }, [flow]);

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      onClose={handleCloseCampaignDialog}
      {...props}
      PaperProps={{ sx: { borderRadius: 5 } }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle alignSelf="center">{flow.title}</DialogTitle>
      <DialogContent sx={{ minWidth: 350 }}>
        <Stack direction="column" spacing={2} alignItems="center">
          <Typography variant="subtitle2" alignSelf="center">
            {flow.description}
          </Typography>
          <Typography variant="h5"> 💸 ${flowTotalBalance}</Typography>

          <Divider flexItem>
            <Typography variant="subtitle2"> External Accounts </Typography>
          </Divider>

          {flow &&
            flow.wallets &&
            flow.wallets
              .filter((wallet) => wallet.network !== 'zkSync Era Testnet')
              .map((wallet, index) => (
                <Box
                  mt={1}
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  alignSelf="stretch"
                  justifyContent="space-between"
                  sx={{ border: 1, borderRadius: 3, p: 1 }}>
                  <Box display="flex" flexDirection="row" alignItems="center">
                    <Avatar
                      src={'/public/networks/' + wallet.network + '.png'}
                      sx={{ width: 24, height: 24 }}
                    />
                    <Typography ml={1}>{shortenWalletAddressLabel(wallet.address)}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        copyToClipboard(wallet.address);
                        toast.success('Wallet address is copied to clipboard!');
                      }}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="subtitle2">${walletBalances[index]}</Typography>
                </Box>
              ))}

          <Divider flexItem>
            <Typography variant="subtitle2"> PayFlow Accounts </Typography>
          </Divider>

          {flow &&
            flow.wallets &&
            flow.wallets
              .filter((wallet) => wallet.network === 'zkSync Era Testnet')
              .map((wallet, index) => (
                <Box
                  mt={1}
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  alignSelf="stretch"
                  justifyContent="space-between"
                  sx={{ border: 1, borderRadius: 3, p: 1 }}>
                  <Box display="flex" flexDirection="row" alignItems="center">
                    <Avatar
                      src={'/public/networks/' + wallet.network + '.png'}
                      sx={{ width: 24, height: 24 }}
                    />
                    <Typography ml={1}>{shortenWalletAddressLabel(wallet.address)}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        copyToClipboard(wallet.address);
                        toast.success('Wallet address is copied to clipboard!');
                      }}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="subtitle2">${walletBalances[index]}</Typography>
                </Box>
              ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
