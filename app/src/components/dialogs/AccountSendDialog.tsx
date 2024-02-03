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
  Tooltip
} from '@mui/material';

import { JsonRpcSigner } from 'ethers';

import { CloseCallbackType } from '../../types/CloseCallbackType';
import { useContext, useMemo, useRef, useState } from 'react';
import { useAccount, useBalance, useConfig } from 'wagmi';
import {
  AddComment,
  ArrowBack,
  AttachMoney,
  ExpandMore,
  LocalGasStation,
  Logout,
  PriorityHigh
} from '@mui/icons-material';
import { Id, toast } from 'react-toastify';

import { Address, formatEther, parseEther } from 'viem';

import { useEthersSigner } from '../../utils/hooks/useEthersSigner';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { IdentityType, SelectedIdentityType } from '../../types/ProfleType';
import { ProfileSection } from '../ProfileSection';
import { AddressSection } from '../AddressSection';
import { SafeAccountConfig } from '@safe-global/protocol-kit';
import { ProfileContext } from '../../contexts/UserContext';
import { SafeVersion } from '@safe-global/safe-core-sdk-types';
import { useSafeTransfer } from '../../utils/hooks/useSafeTransfer';
import { comingSoonToast } from '../Toasts';
import { updateWallet } from '../../services/flow';
import { PayflowChip } from '../chips/IdentityStatusChips';
import {
  estimateFee as estimateSafeTransferFee,
  isSafeSponsored
} from '../../utils/safeTransactions';
import { green, red } from '@mui/material/colors';
import { NetworkSelectorButton } from '../buttons/NetworkSelectorButton';
import { TransferToastContent } from '../toasts/TransferToastContent';
import { LoadingSwitchNetworkButton } from '../buttons/LoadingSwitchNetworkButton';
import { LoadingConnectWalletButton } from '../buttons/LoadingConnectWalletButton';
import { shortenWalletAddressLabel } from '../../utils/address';
import { useEthersProvider } from '../../utils/hooks/useEthersProvider';
import { disconnect } from 'wagmi/actions';
import { LoadingPaymentButton } from '../buttons/LoadingPaymentButton';
import { getGasFeeText } from '../../types/gas';

export type PaymentDialogProps = DialogProps &
  CloseCallbackType & {
    sender: FlowType | Address;
    recipient: SelectedIdentityType;
  } & { setOpenSearchIdentity?: React.Dispatch<React.SetStateAction<boolean>> };

export default function AccountSendDialog({
  closeStateCallback,
  setOpenSearchIdentity,
  sender,
  recipient,
  ...props
}: PaymentDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { profile, ethUsdPrice } = useContext(ProfileContext);

  const ethersSigner = useEthersSigner();
  const ethersProvider = useEthersProvider();

  const wagmiConfig = useConfig();

  const { address, chain } = useAccount();

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

  const { loading, confirmed, error, status, txHash, transfer, reset } = useSafeTransfer();

  const sendToastId = useRef<Id>();

  useMemo(async () => {
    if (!recipient) {
      setSelectedWallet(undefined);
      setCompatibleWallets([]);
      return;
    }

    // TODO: what if there is not a single compatible wallet between sender & recipient
    // in case a new wallet chain added, not all users maybe be compatible, limit by chains recipient supports
    const compatibleSenderWallets =
      recipient.type === 'profile'
        ? (sender as FlowType).wallets.filter((w) =>
            recipient.identity.profile?.defaultFlow?.wallets.find((rw) => rw.network === w.network)
          )
        : (sender as FlowType).wallets;

    setCompatibleWallets(compatibleSenderWallets);

    if (compatibleSenderWallets.length === 0) {
      toast.error('No compatible wallets available!');
      return;
    }

    setSelectedWallet(
      (chain && compatibleSenderWallets.find((w) => w.network === chain.id)) ??
        compatibleSenderWallets[0]
    );
  }, [recipient]);

  useMemo(async () => {
    setGasFee(undefined);

    if (
      selectedWallet &&
      ethersProvider &&
      selectedWallet.network === Number((await ethersProvider.getNetwork()).chainId)
    ) {
      const sponsored = await isSafeSponsored(ethersProvider, selectedWallet.address);
      setGasFee(
        BigInt(
          sponsored
            ? 0
            : await estimateSafeTransferFee(selectedWallet.deployed, selectedWallet.network)
        )
      );
    }
  }, [selectedWallet, ethersProvider]);

  useMemo(async () => {
    if (!sendAmount || !recipient || !selectedWallet) {
      return;
    }

    if (loading && !sendToastId.current) {
      toast.dismiss();
      sendToastId.current = toast.loading(
        <TransferToastContent
          from={{ type: 'profile', identity: { profile: profile } as IdentityType }}
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
            from={{ type: 'profile', identity: { profile: profile } as IdentityType }}
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

      // if tx was successfull, mark wallet as deployed if it wasn't
      if (!selectedWallet.deployed) {
        selectedWallet.deployed = true;
        updateWallet((sender as FlowType).uuid, selectedWallet);
      }
    } else if (error) {
      toast.update(sendToastId.current, {
        render: (
          <TransferToastContent
            from={{ type: 'profile', identity: { profile: profile } as IdentityType }}
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

      if (status === 'rejected') {
        toast.error('Cancelled', { closeButton: false, autoClose: 5000 });
      }

      if (status === 'insufficient_fees') {
        toast.error('Insufficient Gas Fees', { closeButton: false, autoClose: 5000 });
      }
    }
  }, [loading, confirmed, error, status, txHash, sendAmount, recipient]);

  async function sendSafeTransaction(
    flow: FlowType,
    from: FlowWalletType,
    to: Address,
    amount: bigint,
    ethersSigner: JsonRpcSigner
  ) {
    reset();

    const txData = {
      from: from.address,
      to,
      amount
    };

    const safeAccountConfig: SafeAccountConfig = {
      owners: [flow.owner],
      threshold: 1
    };

    const saltNonce = flow.saltNonce as string;
    const safeVersion = from.version as SafeVersion;

    transfer(ethersSigner, txData, safeAccountConfig, safeVersion, saltNonce);
  }

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
    if (!recipient || !selectedWallet) {
      setToAddress(undefined);
      return;
    }

    if (recipient.type === 'address') {
      setToAddress(recipient.identity.address);
    } else {
      setToAddress(
        recipient.identity.profile?.defaultFlow?.wallets.find(
          (w) => w.network === selectedWallet.network
        )?.address
      );
    }
  }, [selectedWallet, recipient]);

  return (
    <Dialog
      fullScreen={isMobile}
      onClose={closeStateCallback}
      {...props}
      PaperProps={{
        sx: {
          borderRadius: 5,
          ...(!isMobile && { width: 375, height: 375 })
        }
      }}
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
          <Stack ml={isMobile ? '25vw' : 0} alignItems="center">
            <Typography variant="h6">Send</Typography>
            <Typography textAlign="center" variant="caption" fontWeight="bold">
              from:{' '}
              <b>
                <u>{(sender as FlowType).title}</u>
              </b>{' '}
              flow
            </Typography>
          </Stack>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 2
        }}>
        <Box
          height="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent={
            address && address === (sender as FlowType).owner && recipient
              ? 'space-between'
              : 'flex-end'
          }>
          {address && address === (sender as FlowType).owner ? (
            <>
              <Stack width="100%" spacing={2} alignItems="center">
                <Box
                  display="flex"
                  flexDirection="row"
                  width="100%"
                  alignItems="center"
                  justifyContent="space-between"
                  {...(setOpenSearchIdentity
                    ? { component: Button, onClick: async () => setOpenSearchIdentity(true) }
                    : {})}
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
                      ? recipient.identity.profile && (
                          <ProfileSection maxWidth={200} profile={recipient.identity.profile} />
                        )
                      : recipient.identity.meta && (
                          <AddressSection maxWidth={200} identity={recipient.identity} />
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
                            isSuccess &&
                            balance &&
                            balance.value - (gasFee ?? BigInt(0)) > BigInt(0)
                              ? parseFloat(
                                  formatEther(balance.value - (gasFee ?? BigInt(0)))
                                ).toFixed(5)
                              : 0
                          } ETH ≈ $${
                            isSuccess &&
                            balance &&
                            balance.value - (gasFee ?? BigInt(0)) > BigInt(0)
                              ? (
                                  parseFloat(formatEther(balance.value - (gasFee ?? BigInt(0)))) *
                                  (ethUsdPrice ?? 0)
                                ).toFixed(2)
                              : 0
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
                      <Typography
                        ml={1}
                        variant="caption"
                        color={gasFee === BigInt(0) ? green.A700 : 'inherit'}>
                        {getGasFeeText(gasFee, ethUsdPrice)}
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </Stack>
              {recipient &&
                selectedWallet &&
                (chain?.id === selectedWallet.network ? (
                  <>
                    <LoadingPaymentButton
                      title="Send"
                      loading={loading || (txHash && !confirmed && !error)}
                      disabled={!(toAddress && sendAmount)}
                      status={status}
                      onClick={async () => {
                        if (toAddress && sendAmount && ethersSigner) {
                          await sendSafeTransaction(
                            sender as FlowType,
                            selectedWallet,
                            toAddress,
                            sendAmount,
                            ethersSigner
                          );
                        } else {
                          toast.error("Can't send to this profile");
                        }
                      }}
                    />
                  </>
                ) : (
                  <LoadingSwitchNetworkButton chainId={selectedWallet.network} />
                ))}
            </>
          ) : address && address !== (sender as FlowType).owner ? (
            <Stack spacing={1} alignItems="center">
              <Typography variant="subtitle2">
                Please, connect following flow signer:{' '}
                <u>
                  <b>{shortenWalletAddressLabel((sender as FlowType).owner)}</b>
                </u>
                {'!'}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2">
                  Currently connected signer:{' '}
                  <u>
                    <b>{shortenWalletAddressLabel(address)}</b>
                  </u>
                </Typography>
                <IconButton
                  size="small"
                  onClick={async () => await disconnect(wagmiConfig)}
                  sx={{ color: red.A700 }}>
                  <Logout />
                </IconButton>
              </Stack>
            </Stack>
          ) : (
            <LoadingConnectWalletButton fullWidth title="Connect Signer" />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
