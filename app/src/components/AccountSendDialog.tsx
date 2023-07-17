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
import { transferEth } from '../utils/zkSyncTransactions';

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

  const { chains, switchNetwork } = useSwitchNetwork();

  const [txHash, setTxHash] = useState<Hash>();

  const sendTransaction = async () => {
    if (sendToAddress && sendAmount) {
      switchNetwork?.(chains.find((c) => c?.name === network)?.id);
      const txData = {
        from,
        to: sendToAddress,
        amount: sendAmount
      };
      const txHash = await transferEth(walletClient as WalletClient, txData);
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
          toast.success(`Sendal from ${from} to ${sendToAddress} was successfully processed!`);
        } else {
          toast.error(`Sendal from ${from} to ${sendToAddress} failed!`);
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
            <Avatar src={'/public/networks/' + network + '.png'} sx={{ width: 24, height: 24 }} />
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
