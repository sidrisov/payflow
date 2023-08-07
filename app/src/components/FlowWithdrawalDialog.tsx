import {
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  useTheme,
  DialogProps,
  Typography,
  Stack,
  Avatar,
  Box,
  IconButton,
  TextField,
  Button,
  Divider,
  InputAdornment
} from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { useMemo, useState } from 'react';
import { Address, WalletClient, usePublicClient, useSwitchNetwork, useWalletClient } from 'wagmi';
import { ContentCopy, ExpandMore } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { copyToClipboard } from '../utils/copyToClipboard';

import { Hash, TransactionReceipt, parseEther } from 'viem';
import { withdrawEth } from '../utils/zkSyncTransactions';
import { safeTransferEth } from '../utils/safeTransactions';
import { zkSyncTestnet } from 'viem/chains';
import { useEthersSigner } from '../utils/hooks/useEthersSigner';

export type FlowWithdrawalDialogProps = DialogProps &
  CloseCallbackType & {
    from: Address;
    to: Address;
    network: string;
  };

export default function FlowWithdrawalDialog({
  closeStateCallback,
  ...props
}: FlowWithdrawalDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { from, to, network } = props;

  const [withdrawAmount, setWithdrawAmount] = useState<bigint>();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const ethersSigner = useEthersSigner();

  const { chains, switchNetwork } = useSwitchNetwork();

  const [txHash, setTxHash] = useState<Hash>();

  const sendTransaction = async () => {
    if (withdrawAmount) {
      switchNetwork?.(chains.find((c) => c?.name === network)?.id);

      let txHash;

      if (chains.find((c) => c?.name === network)?.id === zkSyncTestnet.id) {
        txHash = await withdrawEth(walletClient as WalletClient, {
          contract: from,
          from: to,
          amount: withdrawAmount
        });
      } else {
        if (ethersSigner) {
          txHash = await safeTransferEth(ethersSigner, {
            from,
            to,
            amount: withdrawAmount,
            safeSigner: to
          });
        } else {
          toast.error('Failed to execute transaction!');
          return;
        }
      }
      setTxHash(txHash);
    }
  };

  useMemo(async () => {
    if (txHash) {
      // TODO: add loading indicator
      const receipt = (await publicClient.waitForTransactionReceipt({
        hash: txHash
      })) as {};

      console.log('Receipt: ', receipt);

      if (receipt) {
        if ((receipt as TransactionReceipt).status === 'success') {
          toast.success(`Withdrawal from ${from} to ${to} was successfully processed!`);
        } else {
          toast.error(`Withdrawal from ${from} to ${to} failed!`);
        }
        handleCloseCampaignDialog();
      }
    }
  }, [txHash]);

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  return from && network ? (
    <Dialog
      fullScreen={fullScreen}
      onClose={handleCloseCampaignDialog}
      {...props}
      PaperProps={{ sx: { borderRadius: 5 } }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Stack spacing={1} direction="row" justifyContent="center" alignItems="center">
          <Typography justifySelf="center" variant="h6">
            Withdrawal
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ minWidth: 350 }}>
        <Stack direction="column" spacing={2} alignItems="center">
          <Box
            display="flex"
            flexDirection="row"
            alignSelf="stretch"
            alignItems="center"
            sx={{ height: 56, border: 1, borderRadius: 3, p: 1 }}>
            <Avatar src={'/networks/' + network + '.png'} sx={{ width: 24, height: 24 }} />
            <Typography ml={1} sx={{ overflow: 'scroll' }}>
              {from}
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                copyToClipboard(from);
                toast.success('Wallet address is copied to clipboard!');
              }}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Box>
          <ExpandMore />
          <Box
            display="flex"
            flexDirection="row"
            alignSelf="stretch"
            alignItems="center"
            sx={{ height: 56, border: 1, borderRadius: 3, p: 1 }}>
            <Avatar src={'/networks/' + network + '.png'} sx={{ width: 24, height: 24 }} />
            <Typography ml={1} sx={{ overflow: 'scroll' }}>
              {to}
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                copyToClipboard(to);
                toast.success('Wallet address is copied to clipboard!');
              }}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            variant="outlined"
            label="Amount"
            id="sendAmount"
            type="number"
            InputProps={{
              endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
              inputMode: 'decimal',
              sx: { borderRadius: 3 }
            }}
            onChange={(event) => {
              setWithdrawAmount(parseEther(event.target.value));
            }}
          />
          <Divider flexItem>
            <Button
              disabled={!(from && to && withdrawAmount)}
              fullWidth
              variant="outlined"
              size="medium"
              color="primary"
              onClick={sendTransaction}
              sx={{ mt: 1, borderRadius: 3 }}>
              Withdraw
            </Button>
          </Divider>
        </Stack>
      </DialogContent>
    </Dialog>
  ) : (
    <></>
  );
}
