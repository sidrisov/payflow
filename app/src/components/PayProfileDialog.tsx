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
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, useBalance, useContractRead, useEnsAddress, useNetwork } from 'wagmi';
import { AddComment, ArrowBack, AttachMoney, ExpandMore, PriorityHigh } from '@mui/icons-material';
import { Id, toast } from 'react-toastify';

import AggregatorV2V3Interface from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/interfaces/AggregatorV2V3Interface.sol/AggregatorV2V3Interface.json';

import { Address, formatEther, formatUnits, parseEther } from 'viem';

import { FlowWalletType } from '../types/FlowType';
import {
  MetaType,
  ProfileType,
  ProfileWithSocialsType,
  SelectedProfileWithSocialsType
} from '../types/ProfleType';
import { ProfileSection } from './ProfileSection';
import { AddressSection } from './AddressSection';
import LoadingButton from '@mui/lab/LoadingButton';
import { comingSoonToast } from './Toasts';
import PayflowChip from './PayflowChip';
import { red } from '@mui/material/colors';
import { NetworkSelectorButton } from './NetworkSelectorButton';
import { TransferToastContent } from './toasts/TransferToastContent';
import { LoadingConnectWalletButton } from './LoadingConnectWalletButton';
import { LoadingSwitchNetworkButton } from './LoadingSwitchNetworkButton';
import { useRegularTransfer } from '../utils/hooks/useRegularTransfer';
import { shortenWalletAddressLabel } from '../utils/address';

export type PayProfileDialogProps = DialogProps &
  CloseCallbackType & {
    profile: ProfileType;
  };

export default function PayProfileDialog({
  closeStateCallback,
  profile,
  ...props
}: PayProfileDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const recipient = {
    type: 'profile',
    data: { profile } as ProfileWithSocialsType
  } as SelectedProfileWithSocialsType;

  const { address } = useAccount();

  const { chain } = useNetwork();

  const { isSuccess: isEnsSuccess, data: ethUsdPriceFeedAddress } = useEnsAddress({
    name: 'eth-usd.data.eth',
    chainId: 1,
    cacheTime: 300_000
  });

  const { data: ethUsdPrice } = useContractRead({
    enabled: isEnsSuccess && ethUsdPriceFeedAddress !== undefined,
    chainId: 1,
    address: ethUsdPriceFeedAddress ?? undefined,
    abi: AggregatorV2V3Interface.abi,
    functionName: 'latestAnswer',
    select: (data) => Number(formatUnits(data as bigint, 8)),
    cacheTime: 10_000
  });

  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>();
  const [compatibleWallets, setCompatibleWallets] = useState<FlowWalletType[]>([]);

  const [toAddress, setToAddress] = useState<Address>();
  const [sendAmountUSD, setSendAmountUSD] = useState<number>();
  const [sendAmount, setSendAmount] = useState<bigint>();
  const [balanceEnough, setBalanceEnough] = useState<boolean>();
  const [minAmountSatisfied, setMinAmountSatisfied] = useState<boolean>();
  /*   const [gasFee, setGasFee] = useState<bigint>();
   */
  const { isSuccess, data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId: chain?.id
  });

  const sendToastId = useRef<Id>();

  const { loading, confirmed, error, status, txHash, sendTransaction, reset } = useRegularTransfer({
    to: toAddress,
    amount: sendAmount
  });

  useEffect(() => {
    if (!profile || !address) {
      setSelectedWallet(undefined);
      setCompatibleWallets([]);
      return;
    }

    const compatibleSenderWallets =
      profile.defaultFlow?.wallets.map(
        (wallet) => ({ address, network: wallet.network } as FlowWalletType)
      ) ?? [];

    setCompatibleWallets(compatibleSenderWallets);

    console.debug('compatible sender wallets: ', compatibleSenderWallets);

    if (compatibleSenderWallets.length === 0) {
      toast.error('No compatible wallets available!');
      return;
    }
  }, [address]);

  useEffect(() => {
    const wallet =
      (chain && compatibleWallets.find((w) => w.network === chain.id)) ?? compatibleWallets[0];
    setSelectedWallet(wallet);
    console.debug('selected sender wallet: ', wallet);
  }, [compatibleWallets, chain]);

  useMemo(() => {
    if (!recipient || !selectedWallet) {
      setToAddress(undefined);
      return;
    }

    if (recipient.type === 'address') {
      setToAddress(recipient.data.meta?.addresses[0]);
    } else {
      setToAddress(
        recipient.data.profile?.defaultFlow?.wallets.find(
          (w) => w.network === selectedWallet.network
        )?.address
      );
    }
  }, [selectedWallet]);

  useMemo(async () => {
    if (!sendAmount || !recipient || !selectedWallet) {
      return;
    }

    if (loading && !sendToastId.current) {
      toast.dismiss();
      sendToastId.current = toast.loading(
        <TransferToastContent
          from={{ type: 'address', data: { meta: { addresses: [address] } as MetaType } }}
          to={recipient}
          ethAmount={sendAmount}
          ethUsdPrice={ethUsdPrice}
        />
      );
    }

    if (!sendToastId.current) {
      return;
    }

    if (confirmed) {
      toast.update(sendToastId.current, {
        render: (
          <TransferToastContent
            from={{ type: 'address', data: { meta: { addresses: [address] } as MetaType } }}
            to={recipient}
            ethAmount={sendAmount}
            ethUsdPrice={ethUsdPrice}
          />
        ),
        type: 'success',
        isLoading: false,
        autoClose: 5000
      });
      sendToastId.current = undefined;
      reset();
    } else if (error) {
      toast.update(sendToastId.current, {
        render: (
          <TransferToastContent
            from={{ type: 'address', data: { meta: { addresses: [address] } as MetaType } }}
            to={recipient}
            ethAmount={sendAmount}
            ethUsdPrice={ethUsdPrice}
            status="error"
          />
        ),
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
      sendToastId.current = undefined;
      reset();
    }
  }, [loading, confirmed, error, txHash, sendAmount, recipient]);

  useMemo(async () => {
    if (status === 'rejected') {
      toast.error('Cancelled', { closeButton: false, autoClose: 5000 });
    }
  }, [status]);

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

  return (
    profile && (
      <Dialog
        fullScreen={isMobile}
        onClose={closeStateCallback}
        {...props}
        PaperProps={{ sx: { borderRadius: 5 } }}
        sx={{
          backdropFilter: 'blur(5px)'
        }}>
        <DialogTitle>
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent={isMobile ? 'flex-start' : 'center'}>
            {isMobile && (
              <IconButton onClick={closeStateCallback}>
                <ArrowBack />
              </IconButton>
            )}
            <Stack ml={isMobile ? '18vw' : 0} alignItems="center">
              <Typography variant="h6">Pay</Typography>{' '}
              {address && (
                <Typography textAlign="center" variant="caption" fontWeight="bold">
                  from:{' '}
                  <b>
                    <u>{shortenWalletAddressLabel(address)}</u>
                  </b>{' '}
                  wallet
                </Typography>
              )}
            </Stack>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
          <Box
            display="flex"
            minWidth={350}
            maxWidth={isMobile ? 450 : 350}
            height="100%"
            flexDirection="column"
            alignItems="center"
            justifyContent={address ? 'space-between' : 'flex-end'}>
            {address ? (
              <>
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
                    {recipient &&
                      (recipient.type === 'profile'
                        ? recipient.data.profile && (
                            <ProfileSection maxWidth={200} profile={recipient.data.profile} />
                          )
                        : recipient.data.meta && (
                            <AddressSection maxWidth={200} meta={recipient.data.meta} />
                          ))}

                    {!recipient && (
                      <Typography alignSelf="center" flexGrow={1}>
                        Choose Recipient
                      </Typography>
                    )}

                    <Stack direction="row">
                      {recipient && recipient.type === 'profile' && <PayflowChip />}
                      <ExpandMore />
                    </Stack>
                  </Box>
                  {recipient && selectedWallet && (
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
                          <Stack
                            ml={0.5}
                            mt={0.5}
                            direction="row"
                            spacing={0.5}
                            alignItems="center">
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
                    </Box>
                  )}
                </Stack>

                {recipient &&
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
                    <LoadingSwitchNetworkButton chainId={selectedWallet.network} />
                  ))}
              </>
            ) : (
              <LoadingConnectWalletButton />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    )
  );
}
