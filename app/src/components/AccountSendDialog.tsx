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
import { Address, WalletClient, usePublicClient, useSwitchNetwork, useWalletClient } from 'wagmi';
import { ContentCopy, ExpandMore } from '@mui/icons-material';
import { Id, toast } from 'react-toastify';
import { copyToClipboard } from '../utils/copyToClipboard';

import { Hash, TransactionReceipt, formatEther, parseEther } from 'viem';
import { transferEth } from '../utils/zkSyncTransactions';
import { zkSyncTestnet } from 'wagmi/chains';

import { useEthersSigner } from '../utils/hooks/useEthersSigner';
import { safeTransferEth } from '../utils/safeTransactions';
import { shortenWalletAddressLabel } from '../utils/address';

export type AccountSendDialogProps = DialogProps &
  CloseCallbackType & {
    from: Address;
    to?: Address;
    network: string;
  };

export default function AccountSendDialog({
  closeStateCallback,
  ...props
}: AccountSendDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { from, to, network } = props;

  const [sendToAddress, setSendToAddress] = useState(to as Address);
  const [sendAmount, setSendAmount] = useState<bigint>();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const ethersSigner = useEthersSigner();

  const { chains, switchNetwork } = useSwitchNetwork();

  const [txHash, setTxHash] = useState<Hash>();

  const sendToastId = useRef<Id>();

  const sendTransaction = async () => {
    if (sendToAddress && sendAmount && ethersSigner) {
      sendToastId.current = toast.loading(
        `Sending ${formatEther(sendAmount)} to ${shortenWalletAddressLabel(sendToAddress)} 💸`
      );

      switchNetwork?.(chains.find((c) => c?.name === network)?.id);

      const txData = {
        from,
        to: sendToAddress,
        amount: sendAmount
      };

      let txHash;

      if (chains.find((c) => c?.name === network)?.id === zkSyncTestnet.id) {
        txHash = await transferEth(walletClient as WalletClient, txData);
      } else {
        txHash = await safeTransferEth(ethersSigner, txData);
      }

      if (!txHash) {
        toast.update(sendToastId.current, {
          render: `Transfer to ${shortenWalletAddressLabel(sendToAddress)} failed! 😕`,
          type: 'error',
          isLoading: false,
          autoClose: 5000
        });
        sendToastId.current = undefined;
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
        if (sendToastId.current) {
          toast.update(sendToastId.current, {
            render: `Transfer to ${shortenWalletAddressLabel(sendToAddress)} processed!`,
            type: 'success',
            isLoading: false,
            autoClose: 5000
          });
          sendToastId.current = undefined;
        }
        handleCloseCampaignDialog();
      } else {
        if (sendToastId.current) {
          toast.update(sendToastId.current, {
            render: `Transfer to ${shortenWalletAddressLabel(sendToAddress)} failed! 😕`,
            type: 'error',
            isLoading: false,
            autoClose: 5000
          });
          sendToastId.current = undefined;
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
            Send
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
          <ExpandMore></ExpandMore>
          <TextField
            fullWidth
            id="sendToAddress"
            label="Send to"
            onChange={(event) => {
              setSendToAddress(event.target.value as Address);
            }}
            InputProps={{ inputProps: { maxLength: 42 }, sx: { borderRadius: 3 } }}
          />
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
              setSendAmount(parseEther(event.target.value));
            }}
          />
          <Divider flexItem>
            <Button
              disabled={!(sendToAddress && sendAmount)}
              fullWidth
              variant="outlined"
              size="medium"
              color="primary"
              onClick={sendTransaction}
              sx={{ mt: 1, borderRadius: 3 }}>
              Send
            </Button>
          </Divider>
        </Stack>
      </DialogContent>
    </Dialog>
  ) : (
    <></>
  );
}
