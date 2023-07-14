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
import { FlowWalletType } from '../types/FlowType';
import { useMemo, useState } from 'react';
import { Address, WalletClient, usePublicClient, useSwitchNetwork, useWalletClient } from 'wagmi';
import { ContentCopy, ExpandMore } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { copyToClipboard } from '../utils/copyToClipboard';

import { Hash, TransactionReceipt, parseEther } from 'viem';
import { transferEth } from '../utils/zkSyncTransactions';

export type FlowWithdrawalDialogProps = DialogProps &
  CloseCallbackType & {
    wallet: FlowWalletType;
  };

export default function FlowWithdrawalDialog({
  closeStateCallback,
  ...props
}: FlowWithdrawalDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const wallet = props.wallet;

  const [withdrawToAddress, setWithdrawToAddress] = useState<Address>();
  const [withdrawAmount, setWithdrawAmount] = useState<bigint>();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const { chains, switchNetwork } = useSwitchNetwork();

  const [txHash, setTxHash] = useState<Hash>();

  const sendTransaction = async () => {
    if (withdrawToAddress && withdrawAmount) {
      switchNetwork?.(chains.find((c) => c?.name === wallet.network)?.id);
      const txData = {
        from: wallet.address,
        to: withdrawToAddress,
        amount: withdrawAmount
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
          toast.success(
            `Withdrawal from ${wallet.address} to ${withdrawToAddress} was successfully processed!`
          );
        } else {
          toast.error(`Withdrawal from ${wallet.address} to ${withdrawToAddress} failed!`);
        }
        handleCloseCampaignDialog();
      }
    }
  }, [txHash]);

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  return wallet ? (
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
            <Avatar
              src={'/public/networks/' + wallet.network + '.png'}
              sx={{ width: 24, height: 24 }}
            />
            <Typography ml={1} sx={{ overflow: 'scroll' }}>
              {wallet.address}
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                copyToClipboard(wallet.address);
                toast.success('Wallet address is copied to clipboard!');
              }}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Box>
          <ExpandMore></ExpandMore>
          <TextField
            fullWidth
            id="withdrawToAddress"
            label="Withdraw To"
            onChange={(event) => {
              setWithdrawToAddress(event.target.value as Address);
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
              setWithdrawAmount(parseEther(event.target.value));
            }}
          />
          <Divider flexItem>
            <Button
              disabled={!(withdrawToAddress && withdrawAmount)}
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
