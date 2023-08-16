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
import { useMemo, useRef, useState } from 'react';
import {
  Address,
  WalletClient,
  useBalance,
  usePublicClient,
  useSwitchNetwork,
  useWalletClient
} from 'wagmi';
import { ContentCopy, ExpandMore } from '@mui/icons-material';
import { Id, toast } from 'react-toastify';
import { copyToClipboard } from '../utils/copyToClipboard';

import { Hash, TransactionReceipt, formatEther, parseEther } from 'viem';
import { withdrawEth } from '../utils/zkSyncTransactions';
import { safeTransferEth } from '../utils/safeTransactions';
import { zkSyncTestnet } from 'viem/chains';
import { useEthersSigner } from '../utils/hooks/useEthersSigner';
import { shortenWalletAddressLabel } from '../utils/address';

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

  const { isSuccess, data: balance } = useBalance({
    address: from,
    chainId: chains.find((c) => c?.name === network)?.id
  });

  const [txHash, setTxHash] = useState<Hash>();

  const withdrawalToastId = useRef<Id>();

  const sendTransaction = async () => {
    if (withdrawAmount && ethersSigner) {
      withdrawalToastId.current = toast.loading(
        `Sending ${formatEther(withdrawAmount)} to ${shortenWalletAddressLabel(to)} 💸`
      );

      switchNetwork?.(chains.find((c) => c?.name === network)?.id);

      let txHash;

      if (chains.find((c) => c?.name === network)?.id === zkSyncTestnet.id) {
        txHash = await withdrawEth(walletClient as WalletClient, {
          contract: from,
          from: to,
          amount: withdrawAmount
        });
      } else {
        txHash = await safeTransferEth(ethersSigner, {
          from,
          to,
          amount: withdrawAmount,
          safeSigner: to
        });
      }

      if (!txHash) {
        toast.update(withdrawalToastId.current, {
          render: `Withdrwal to ${shortenWalletAddressLabel(to)} failed! 😕`,
          type: 'error',
          isLoading: false,
          autoClose: 5000
        });
        withdrawalToastId.current = undefined;
      } else {
        setTxHash(txHash);
      }
    }
  };

  useMemo(async () => {
    if (txHash) {
      const receipt = (await publicClient.waitForTransactionReceipt({
        hash: txHash
      })) as TransactionReceipt;

      console.log('Receipt: ', receipt);

      if (receipt && receipt.status === 'success') {
        if (withdrawalToastId.current) {
          toast.update(withdrawalToastId.current, {
            render: `Withdrawal to ${shortenWalletAddressLabel(to)} processed!`,
            type: 'success',
            isLoading: false,
            autoClose: 5000
          });
          withdrawalToastId.current = undefined;
        }
        handleCloseCampaignDialog();
      } else {
        if (withdrawalToastId.current) {
          toast.update(withdrawalToastId.current, {
            render: `Withdrawal to ${shortenWalletAddressLabel(to)} failed! 😕`,
            type: 'error',
            isLoading: false,
            autoClose: 5000
          });
          withdrawalToastId.current = undefined;
        }
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
                toast.success('Address is copied!');
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
                toast.success('Address is copied!');
              }}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            variant="outlined"
            label={`Amount (max: ${
              isSuccess ? balance && parseFloat(formatEther(balance?.value)).toPrecision(1) : 0
            })`}
            id="sendAmount"
            type="number"
            InputProps={{
              endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
              inputMode: 'decimal',
              sx: { borderRadius: 3 }
            }}
            onChange={(event) => {
              const amount = parseEther(event.target.value);
              if (balance && amount <= balance?.value) {
                setWithdrawAmount(amount);
              }
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
