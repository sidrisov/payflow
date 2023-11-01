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
import { useBalance, useNetwork, usePublicClient, useSwitchNetwork, useWalletClient } from 'wagmi';
import { ExpandMore, Wallet, WalletOutlined, WalletRounded } from '@mui/icons-material';
import { Id, toast } from 'react-toastify';

import { Address, Hash, TransactionReceipt, formatEther, isAddress, parseEther } from 'viem';

import { useEthersSigner } from '../utils/hooks/useEthersSigner';
import { safeTransferEth } from '../utils/safeTransactions';
import { shortenWalletAddressLabel } from '../utils/address';
import { FlowType, FlowWalletType } from '../types/FlowType';
import { ChooseWalletMenu } from './ChooseWalletMenu';
import SearchProfileDialog from './SearchProfileDialog';
import { ProfileType } from '../types/ProfleType';

export type AccountSendDialogProps = DialogProps &
  CloseCallbackType & {
    flow: FlowType;
  };

export default function AccountSendDialog({
  closeStateCallback,
  ...props
}: AccountSendDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { flow } = props;

  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>(flow.wallets[0]);

  const [sendToAddress, setSendToAddress] = useState<Address | ProfileType>();

  const [sendAmount, setSendAmount] = useState<bigint>();

  const [openSearchProfile, setOpenSearchProfile] = useState<boolean>(false);

  const publicClient = usePublicClient();
  const ethersSigner = useEthersSigner();

  const { chains, switchNetwork } = useSwitchNetwork();
  const { chain } = useNetwork();

  const { isSuccess, data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId: chain?.id
  });

  const [openSelectWallet, setOpenSelectWallet] = useState(false);
  const [walletAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);

  const [txHash, setTxHash] = useState<Hash>();

  const sendToastId = useRef<Id>();

  function isProfileType(object: any): object is ProfileType {
    return !isAddress(object);
  }

  const sendTransaction = async () => {
    if (sendToAddress && sendAmount && ethersSigner) {
      sendToastId.current = toast.loading(
        `Sending ${formatEther(sendAmount)} to ${shortenWalletAddressLabel(
          isProfileType(sendToAddress) ? sendToAddress.address : sendToAddress
        )} 💸`
      );

      switchNetwork?.(chains.find((c) => c?.name === selectedWallet?.network)?.id);

      const txData = {
        from: selectedWallet.address,
        to: (sendToAddress as Address)
          ? (sendToAddress as Address)
          : (sendToAddress as ProfileType).address,
        amount: sendAmount
      };

      const txHash = await safeTransferEth(ethersSigner, txData);

      if (!txHash) {
        toast.update(sendToastId.current, {
          render: `Transfer to ${shortenWalletAddressLabel(
            isProfileType(sendToAddress) ? sendToAddress.address : sendToAddress
          )} failed! 😕`,
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
    const chainId = chains.find((c) => c.name === selectedWallet.network)?.id;
    switchNetwork?.(chainId);
  }, [selectedWallet]);

  useMemo(async () => {
    if (txHash) {
      const receipt = (await publicClient.waitForTransactionReceipt({
        hash: txHash
      })) as TransactionReceipt;

      console.log('Receipt: ', receipt);

      if (receipt && receipt.status === 'success') {
        if (sendToastId.current) {
          toast.update(sendToastId.current, {
            render: `Transfer to ${shortenWalletAddressLabel(
              isProfileType(sendToAddress) ? sendToAddress.address : sendToAddress
            )} processed!`,
            type: 'success',
            isLoading: false,
            autoClose: 5000
          });
          sendToastId.current = undefined;
        }
        handleCloseSendDialog();
      } else {
        if (sendToastId.current) {
          toast.update(sendToastId.current, {
            render: `Transfer to ${shortenWalletAddressLabel(
              (sendToAddress as Address)
                ? (sendToAddress as Address)
                : (sendToAddress as ProfileType).address
            )} failed! 😕`,
            type: 'error',
            isLoading: false,
            autoClose: 5000
          });
          sendToastId.current = undefined;
        }
      }
    }
  }, [txHash]);

  function handleCloseSendDialog() {
    closeStateCallback();
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      onClose={handleCloseSendDialog}
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
            <IconButton
              sx={{ width: 40, height: 40, border: 1, borderStyle: 'dashed' }}
              onClick={(event) => {
                setWalletAnchorEl(event.currentTarget);
                setOpenSelectWallet(true);
              }}>
              <Avatar
                src={'/networks/' + selectedWallet.network + '.png'}
                sx={{ width: 28, height: 28 }}
              />
            </IconButton>
            <Box display="flex" flexDirection="row" flexGrow={1} justifyContent="center">
              <Typography sx={{ m: 1, fontSize: 18, overflow: 'clip' }}>{flow.title}</Typography>
            </Box>
          </Box>
          <ExpandMore />

          <Box
            display="flex"
            flexDirection="row"
            alignSelf="stretch"
            alignItems="center"
            component={Button}
            color="inherit"
            onClick={async () => setOpenSearchProfile(true)}
            sx={{
              height: 56,
              border: 1,
              borderRadius: 3,
              p: 1,
              textTransform: 'none'
            }}>
            {sendToAddress &&
              (isProfileType(sendToAddress) ? (
                <Avatar src="/logo.svg" sx={{ width: 35, height: 35 }} />
              ) : (
                <WalletRounded fontSize="large" />
              ))}
            <Box display="flex" flexDirection="row" flexGrow={1} justifyContent="center">
              <Typography ml={-2} fontSize={18}>
                {sendToAddress
                  ? isProfileType(sendToAddress)
                    ? sendToAddress.username
                    : shortenWalletAddressLabel(sendToAddress)
                  : 'Choose recipient'}
              </Typography>
            </Box>
            <ExpandMore />
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
                setSendAmount(amount);
              }
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
      <ChooseWalletMenu
        anchorEl={walletAnchorEl}
        open={openSelectWallet}
        onClose={async () => setOpenSelectWallet(false)}
        wallets={flow.wallets}
        selectedWallet={selectedWallet}
        setSelectedWallet={setSelectedWallet}
      />
      {openSearchProfile && (
        <SearchProfileDialog
          open={openSearchProfile}
          closeStateCallback={() => {
            setOpenSearchProfile(false);
          }}
          selectProfileCallback={(profile) => {
            setSendToAddress(profile);
          }}
        />
      )}
    </Dialog>
  );
}
