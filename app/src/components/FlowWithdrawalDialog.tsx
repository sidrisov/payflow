import {
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  useTheme,
  DialogProps,
  Typography,
  Stack,
  Box,
  IconButton,
  TextField,
  Button,
  Divider,
  InputAdornment
} from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { useMemo, useRef, useState } from 'react';
import { useBalance, usePublicClient, useSwitchNetwork, useWalletClient } from 'wagmi';
import { ContentCopy, ExpandMore } from '@mui/icons-material';
import { Id, toast } from 'react-toastify';
import { copyToClipboard } from '../utils/copyToClipboard';

import { Hash, TransactionReceipt, formatEther, keccak256, parseEther, toHex } from 'viem';
import { safeDeploy, safeTransferEth } from '../utils/safeTransactions';
import { useEthersSigner } from '../utils/hooks/useEthersSigner';
import { shortenWalletAddressLabel } from '../utils/address';
import { isSafeDeployed } from '../utils/safeContracts';
import { SafeAccountConfig } from '@safe-global/protocol-kit';
import { FlowType, FlowWalletType } from '../types/FlowType';
import axios from 'axios';
import { delay } from '../utils/delay';
import { API_URL } from '../utils/urlConstants';
import NetworkAvatar from './NetworkAvatar';

export type FlowWithdrawalDialogProps = DialogProps &
  CloseCallbackType & {
    flow: FlowType;
    wallet: FlowWalletType;
  };

export default function FlowWithdrawalDialog({
  closeStateCallback,
  flow,
  wallet,
  ...props
}: FlowWithdrawalDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [withdrawAmount, setWithdrawAmount] = useState<bigint>();

  const publicClient = usePublicClient();
  const ethersSigner = useEthersSigner();

  const { switchNetwork } = useSwitchNetwork();

  const { isSuccess, data: balance } = useBalance({
    address: wallet.address,
    chainId: wallet.network
  });

  const [txHash, setTxHash] = useState<Hash>();

  const withdrawalToastId = useRef<Id>();

  const sendTransaction = async () => {
    console.log(wallet);

    if (withdrawAmount && ethersSigner) {
      withdrawalToastId.current = toast.loading(`Loading ...`);

      switchNetwork?.(wallet.network);

      let txHash;

      if (!wallet.safeDeployed) {
        const isDeployed = await isSafeDeployed(wallet.address, ethersSigner);

        if (!isDeployed) {
          toast.update(withdrawalToastId.current, {
            render: `Initializing Wallet 🪄`,
            isLoading: true
          });

          const safeAccountConfig: SafeAccountConfig = {
            owners: [wallet.master],
            threshold: 1
          };

          let safeDeployTxHash;
          await safeDeploy({
            ethersSigner,
            safeAccountConfig,
            saltNonce: keccak256(toHex(flow.uuid)),
            sponsored: true,
            callback: (txHash: string | undefined): void => {
              safeDeployTxHash = txHash;
            }
          });
          // TODO: hack
          await delay(5000);

          if (!safeDeployTxHash) {
            toast.update(withdrawalToastId.current, {
              render: `Initialization failed!`,
              type: 'error',
              isLoading: false,
              autoClose: 5000
            });
            return;
          }

          const receipt = await publicClient.waitForTransactionReceipt({
            hash: safeDeployTxHash
          });

          if (receipt && receipt.status === 'success') {
            toast.success('Wallet initialized!');
          } else {
            toast.update(withdrawalToastId.current, {
              render: `Initialization failed!`,
              type: 'error',
              isLoading: false,
              autoClose: 5000
            });
            return;
          }
        }

        try {
          wallet.safeDeployed = true;
          const response = await axios.put(`${API_URL}/api/flows/${flow.uuid}/wallet`, wallet, {
            withCredentials: true
          });
          console.log(response.status);
        } catch (error) {
          console.log(error);
          toast.update(withdrawalToastId.current, {
            render: `Failed to save wallet!`,
            type: 'error',
            isLoading: false,
            autoClose: 5000
          });
          return;
        }
      }

      toast.update(withdrawalToastId.current, {
        render: `Sending ${formatEther(withdrawAmount)} to ${shortenWalletAddressLabel(
          wallet.master
        )}`,
        isLoading: true
      });

      txHash = await safeTransferEth(ethersSigner, {
        from: wallet.address,
        to: wallet.master,
        amount: withdrawAmount,
        safeSigner: wallet.master
      });

      if (!txHash) {
        toast.update(withdrawalToastId.current, {
          render: `Withdrwal to ${shortenWalletAddressLabel(wallet.master)} failed! 😕`,
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
            render: `Withdrawal to ${shortenWalletAddressLabel(wallet.master)} processed!`,
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
            render: `Withdrawal to ${shortenWalletAddressLabel(wallet.master)} failed! 😕`,
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
            <NetworkAvatar network={wallet.network} sx={{ width: 24, height: 24 }} />
            <Typography ml={1} sx={{ overflow: 'scroll' }}>
              {wallet.address}
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                copyToClipboard(wallet.address);
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
            <NetworkAvatar network={wallet.network} sx={{ width: 24, height: 24 }} />
            <Typography ml={1} sx={{ overflow: 'scroll' }}>
              {wallet.master}
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                copyToClipboard(wallet.master);
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
              disabled={!withdrawAmount}
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
