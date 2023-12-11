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
  InputAdornment,
  CircularProgress,
  Tooltip
} from '@mui/material';

import { CloseCallbackType } from '../types/CloseCallbackType';
import { useMemo, useRef, useState } from 'react';
import {
  useAccount,
  useBalance,
  useContractRead,
  useEnsAddress,
  useNetwork,
  usePrepareSendTransaction,
  useSendTransaction,
  useSwitchNetwork
} from 'wagmi';
import {
  AddComment,
  ArrowForward,
  AttachMoney,
  Close,
  ExpandMore,
  LocalGasStation,
  PriorityHigh
} from '@mui/icons-material';
import { Id, toast } from 'react-toastify';

import AggregatorV2V3Interface from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/interfaces/AggregatorV2V3Interface.sol/AggregatorV2V3Interface.json';

import { Address, formatEther, formatUnits, parseEther } from 'viem';

import { FlowType, FlowWalletType } from '../types/FlowType';
import { MetaType, SelectedProfileWithSocialsType } from '../types/ProfleType';
import { ProfileSection } from './ProfileSection';
import { AddressSection } from './AddressSection';
import LoadingButton from '@mui/lab/LoadingButton';
import { comingSoonToast } from './Toasts';
import PayflowChip from './PayflowChip';
import { estimateFee as estimateSafeTransferFee } from '../utils/safeTransactions';
import { red } from '@mui/material/colors';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { NetworkSelectorButton } from './NetworkSelectorButton';

export type PayProfileDialogProps = DialogProps &
  CloseCallbackType & {
    flow: FlowType;
    recipient?: SelectedProfileWithSocialsType;
  };

export default function PayProfileDialog({
  closeStateCallback,
  flow,
  recipient: selectedRecipient,
  ...props
}: PayProfileDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { address } = useAccount();
  const { openConnectModal, connectModalOpen } = useConnectModal();

  const { chain } = useNetwork();
  const { switchNetwork, isLoading: isSwitchNetworkLoading } = useSwitchNetwork();

  const { isSuccess: isEnsSuccess, data: ethUsdPriceFeedAddress } = useEnsAddress({
    name: 'eth-usd.data.eth',
    chainId: 1,
    cacheTime: 60_000
  });

  const { data: ethUsdPrice } = useContractRead({
    enabled: isEnsSuccess && ethUsdPriceFeedAddress !== undefined,
    chainId: 1,
    address: ethUsdPriceFeedAddress ?? undefined,
    abi: AggregatorV2V3Interface.abi,
    functionName: 'latestAnswer',
    select: (data) => Number(formatUnits(data as bigint, 8)),
    cacheTime: 60_000
  });

  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>();
  const [compatibleWallets, setCompatibleWallets] = useState<FlowWalletType[]>([]);

  const [toAddress, setToAddress] = useState<Address>();
  const [sendAmountUSD, setSendAmountUSD] = useState<number>();
  const [sendAmount, setSendAmount] = useState<bigint>();
  const [balanceEnough, setBalanceEnough] = useState<boolean>();
  const [minAmountSatisfied, setMinAmountSatisfied] = useState<boolean>();
  const [gasFee, setGasFee] = useState<bigint>();

  const { isSuccess, data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId: chain?.id
  });

  const sendToastId = useRef<Id>();

  const { config } = usePrepareSendTransaction({
    enabled: toAddress !== undefined,
    to: toAddress,
    value: sendAmount
  });

  const {
    isSuccess: confirmed,
    isLoading: loading,
    error,
    status,
    data: txHash,
    sendTransaction
  } = useSendTransaction(config);

  useMemo(async () => {
    if (!selectedRecipient) {
      setSelectedWallet(undefined);
      setCompatibleWallets([]);
      return;
    }

    const compatibleSenderWallets = flow.wallets.map(
      (wallet) => ({ address, network: wallet.network } as FlowWalletType)
    );

    setCompatibleWallets(compatibleSenderWallets);

    if (compatibleSenderWallets.length === 0) {
      toast.error('No compatible wallets available!');
      return;
    }

    setSelectedWallet(
      (chain && compatibleSenderWallets.find((w) => w.network === chain.id)) ??
        compatibleSenderWallets[0]
    );
  }, [selectedRecipient]);

  useMemo(async () => {
    if (selectedWallet) {
      setGasFee(
        BigInt(await estimateSafeTransferFee(selectedWallet.deployed, selectedWallet.network))
      );
    }
  }, [selectedWallet]);

  useMemo(async () => {
    if (!sendAmount || !selectedRecipient || !selectedWallet) {
      return;
    }

    if (loading) {
      sendToastId.current = toast.loading(
        <Box display="flex" flexDirection="row" alignItems="center" justifyContent="space-between">
          <AddressSection meta={{ addresses: [address] } as MetaType} />
          <Stack alignItems="center" justifyContent="center">
            <Typography variant="subtitle2">
              ${(parseFloat(formatEther(sendAmount)) * (ethUsdPrice ?? 0)).toPrecision(3)}
            </Typography>
            <ArrowForward />
          </Stack>
          {selectedRecipient.type === 'profile'
            ? selectedRecipient.data.profile && (
                <ProfileSection profile={selectedRecipient.data.profile} />
              )
            : selectedRecipient.data.meta && <AddressSection meta={selectedRecipient.data.meta} />}
        </Box>
      );
    }

    if (!sendToastId.current) {
      return;
    }

    if (confirmed) {
      toast.update(sendToastId.current, {
        render: (
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            <AddressSection meta={{ addresses: [address] } as MetaType} />
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="caption">
                $
                {sendAmount
                  ? (parseFloat(formatEther(sendAmount)) * (ethUsdPrice ?? 0)).toPrecision(3)
                  : 0}
              </Typography>
              <ArrowForward />
            </Stack>
            {selectedRecipient.type === 'profile'
              ? selectedRecipient.data.profile && (
                  <ProfileSection profile={selectedRecipient.data.profile} />
                )
              : selectedRecipient.data.meta && (
                  <AddressSection meta={selectedRecipient.data.meta} />
                )}
          </Box>
        ),
        type: 'success',
        isLoading: false,
        autoClose: 5000
      });
      sendToastId.current = undefined;

      /*       // if tx was successfull, mark wallet as deployed if it wasn't
      if (!selectedWallet.deployed) {
        selectedWallet.deployed = true;
        updateWallet(flow.uuid, selectedWallet);
      } */
    } else if (error) {
      toast.update(sendToastId.current, {
        render: (
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            <AddressSection meta={{ addresses: [address] } as MetaType} />
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="caption">
                $
                {sendAmount
                  ? (parseFloat(formatEther(sendAmount)) * (ethUsdPrice ?? 0)).toPrecision(3)
                  : 0}
              </Typography>
              <Close />
            </Stack>
            {selectedRecipient.type === 'profile'
              ? selectedRecipient.data.profile && (
                  <ProfileSection profile={selectedRecipient.data.profile} />
                )
              : selectedRecipient.data.meta && (
                  <AddressSection meta={selectedRecipient.data.meta} />
                )}
          </Box>
        ),
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
      sendToastId.current = undefined;
    }
  }, [loading, confirmed, error, txHash, sendAmount, selectedRecipient]);

  useMemo(async () => {
    if (sendAmountUSD !== undefined && ethUsdPrice) {
      const amount = parseEther((sendAmountUSD / ethUsdPrice).toString());

      const balanceEnough = balance && amount <= balance?.value;
      const minAmount = sendAmountUSD >= 1;

      setBalanceEnough(balanceEnough);
      setMinAmountSatisfied(minAmount);

      if (minAmount && balanceEnough) {
        setSendAmount(amount);
      } else {
        setSendAmount(undefined);
      }
    } else {
      setBalanceEnough(undefined);
      setMinAmountSatisfied(undefined);
    }
  }, [sendAmountUSD, chain?.id]);

  useMemo(async () => {
    if (!selectedRecipient || !selectedWallet) {
      setToAddress(undefined);
      return;
    }

    if (switchNetwork) {
      switchNetwork(selectedWallet.network);
    }

    if (selectedRecipient.type === 'address') {
      setToAddress(selectedRecipient.data.meta?.addresses[0]);
    } else {
      setToAddress(
        selectedRecipient.data.profile?.defaultFlow?.wallets.find(
          (w) => w.network === selectedWallet.network
        )?.address
      );
    }
  }, [selectedWallet, selectedRecipient]);

  function getGasFeeText(): string {
    return 'fee: '.concat(
      gasFee !== undefined
        ? `${parseFloat(formatEther(gasFee)).toFixed(5)} ETH ≈ $${(
            parseFloat(formatEther(gasFee)) * (ethUsdPrice ?? 0)
          ).toFixed(2)}`
        : '...'
    );
  }

  return (
    <>
      <Dialog
        fullScreen={isMobile}
        onClose={closeStateCallback}
        {...props}
        PaperProps={{ sx: { borderRadius: 5 } }}
        sx={{
          backdropFilter: 'blur(5px)'
        }}>
        <DialogTitle>
          <Stack alignItems="center">
            <Typography justifySelf="center" variant="h6">
              Pay
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
          {!address ? (
            <Box minWidth={350}>
              <LoadingButton
                fullWidth
                variant="outlined"
                loading={connectModalOpen}
                size="large"
                color="primary"
                onClick={() => {
                  openConnectModal?.();
                }}
                sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
                Connect Wallet
              </LoadingButton>
            </Box>
          ) : (
            <Box
              display="flex"
              minWidth={350}
              maxWidth={isMobile ? 450 : 350}
              height="100%"
              flexDirection="column"
              alignItems="center"
              justifyContent="space-between">
              <Stack width="100%" spacing={2} alignItems="center">
                <Box
                  display="flex"
                  flexDirection="row"
                  width="100%"
                  alignItems="center"
                  justifyContent="space-between"
                  component={Button}
                  color="inherit"
                  sx={{
                    height: 56,
                    border: 1,
                    borderRadius: 5,
                    p: 1.5,
                    textTransform: 'none'
                  }}>
                  {selectedRecipient &&
                    (selectedRecipient.type === 'profile'
                      ? selectedRecipient.data.profile && (
                          <ProfileSection profile={selectedRecipient.data.profile} />
                        )
                      : selectedRecipient.data.meta && (
                          <AddressSection meta={selectedRecipient.data.meta} />
                        ))}

                  {!selectedRecipient && (
                    <Typography alignSelf="center" flexGrow={1}>
                      Choose Recipient
                    </Typography>
                  )}

                  <Stack direction="row">
                    {selectedRecipient && selectedRecipient.type === 'profile' && <PayflowChip />}
                    <ExpandMore />
                  </Stack>
                </Box>
                {selectedRecipient && selectedWallet && (
                  <Box width="100%" display="flex" flexDirection="column">
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="number"
                      error={
                        sendAmountUSD !== undefined &&
                        (minAmountSatisfied === false || balanceEnough === false)
                      }
                      inputProps={{ style: { textAlign: 'center', fontSize: 20 } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <NetworkSelectorButton
                              selectedWallet={selectedWallet}
                              setSelectedWallet={setSelectedWallet}
                              wallets={compatibleWallets}
                            />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Box
                              display="flex"
                              flexDirection="row"
                              justifyContent="space-between"
                              alignItems="center"
                              minWidth={150}>
                              <Typography>$</Typography>
                              <Typography>≈</Typography>
                              <Typography>
                                {`${
                                  sendAmount
                                    ? parseFloat(formatEther(sendAmount)).toPrecision(3)
                                    : 0
                                }
                        ETH`}
                              </Typography>
                            </Box>
                          </InputAdornment>
                        ),
                        inputMode: 'decimal',
                        sx: { borderRadius: 5, height: 56 }
                      }}
                      onChange={(event) => {
                        if (event.target.value) {
                          const amountUSD = parseFloat(event.target.value);
                          setSendAmountUSD(amountUSD);
                        } else {
                          setSendAmountUSD(undefined);
                        }
                      }}
                    />

                    {sendAmountUSD !== undefined &&
                      (minAmountSatisfied === false || balanceEnough === false) && (
                        <Stack ml={0.5} mt={0.5} direction="row" spacing={0.5} alignItems="center">
                          <PriorityHigh fontSize="small" sx={{ color: red.A400 }} />
                          <Typography ml={1} variant="caption" color={red.A400}>
                            {sendAmountUSD !== undefined &&
                              ((minAmountSatisfied === false && 'min: $1') ||
                                (balanceEnough === false && 'balance: not enough'))}
                          </Typography>
                        </Stack>
                      )}

                    <Box
                      display="flex"
                      flexDirection="row"
                      justifyContent="space-between"
                      alignItems="center">
                      <Stack ml={0.5} direction="row" spacing={0.5} alignItems="center">
                        <AttachMoney fontSize="small" />
                        <Typography variant="caption">
                          {`max: ${
                            isSuccess
                              ? balance && parseFloat(formatEther(balance.value)).toFixed(5)
                              : 0
                          } ETH ≈ $${
                            isSuccess
                              ? balance &&
                                (
                                  parseFloat(formatEther(balance.value)) * (ethUsdPrice ?? 0)
                                ).toFixed(2)
                              : 0.0
                          }`}
                        </Typography>
                      </Stack>
                      <Tooltip title="Add a note">
                        <IconButton
                          size="small"
                          color="inherit"
                          sx={{ mr: 0.5, alignSelf: 'flex-end' }}
                          onClick={() => {
                            comingSoonToast();
                          }}>
                          <AddComment fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Stack ml={0.5} direction="row" spacing={0.5} alignItems="center">
                      <Tooltip
                        title="Gas is paid by the sending flow wallet via Gelato SyncFee call method. 
                    The fee includes Gelato on-chain call, safe tx fee + deployment fee on the first tx, and 10% Gelato's comission on top of all.">
                        <LocalGasStation fontSize="small" />
                      </Tooltip>
                      <Typography ml={1} variant="caption">
                        {getGasFeeText()}
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </Stack>

              {selectedRecipient &&
                selectedWallet &&
                (chain?.id === selectedWallet.network ? (
                  <LoadingButton
                    fullWidth
                    variant="outlined"
                    loading={loading || (txHash && !confirmed && !error)}
                    disabled={!(toAddress && sendAmount)}
                    loadingIndicator={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress color="inherit" size={16} />
                        <Typography variant="button">{status}</Typography>
                      </Stack>
                    }
                    size="large"
                    color="primary"
                    onClick={() => sendTransaction?.()}
                    sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
                    Pay
                  </LoadingButton>
                ) : (
                  <LoadingButton
                    fullWidth
                    variant="outlined"
                    loading={isSwitchNetworkLoading}
                    size="large"
                    color="primary"
                    onClick={() => {
                      switchNetwork?.(selectedWallet.network);
                    }}
                    sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
                    Switch Network
                  </LoadingButton>
                ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}