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
import { useContext, useMemo, useRef, useState } from 'react';
import { useBalance, useNetwork, useSwitchNetwork } from 'wagmi';
import {
  AddComment,
  ArrowForward,
  AttachMoney,
  Close,
  ExpandMore,
  LocalGasStation
} from '@mui/icons-material';
import { Id, toast } from 'react-toastify';

import { Address, formatEther, parseEther } from 'viem';

import { useEthersSigner } from '../utils/hooks/useEthersSigner';
import { FlowType, FlowWalletType } from '../types/FlowType';
import { ChooseWalletMenu } from './ChooseWalletMenu';
import SearchProfileDialog from './SearchProfileDialog';
import { SelectedProfileWithSocialsType } from '../types/ProfleType';
import { ProfileSection } from './ProfileSection';
import { AddressSection } from './AddressSection';
import LoadingButton from '@mui/lab/LoadingButton';
import { SafeAccountConfig } from '@safe-global/protocol-kit';
import { UserContext } from '../contexts/UserContext';
import { SafeVersion } from '@safe-global/safe-core-sdk-types';
import { useSafeTransfer } from '../utils/hooks/useSafeTransfer';
import { comingSoonToast } from './Toasts';
import { updateWallet } from '../services/flow';
import NetworkAvatar from './NetworkAvatar';
import PayflowChip from './PayflowChip';
import { estimateFee as estimateSafeTransferFee } from '../utils/safeTransactions';

export type AccountSendDialogProps = DialogProps &
  CloseCallbackType & {
    flow: FlowType;
  };

export default function AccountSendDialog({
  closeStateCallback,
  flow,
  ...props
}: AccountSendDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { profile, ethUsdPrice } = useContext(UserContext);

  const ethersSigner = useEthersSigner();

  const { switchNetwork, isLoading: isSwitchNetworkLoading } = useSwitchNetwork();
  const { chain } = useNetwork();

  // TODO: what if there is not a single compatible wallet between sender & recipient
  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>(
    /* flow.wallets.find((w) => w.network === chain?.id) ??  */ flow.wallets[0]
  );

  const [selectedRecipient, setSelectedRecipient] = useState<SelectedProfileWithSocialsType>();

  const [toAddress, setToAddress] = useState<Address>();
  const [sendAmount, setSendAmount] = useState<bigint>();

  const [gasFee, setGasFee] = useState<bigint>();

  const [openSearchProfile, setOpenSearchProfile] = useState<boolean>(true);

  const { isSuccess, data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId: chain?.id
  });

  const [openSelectWallet, setOpenSelectWallet] = useState(false);
  const [walletAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);

  const sendToastId = useRef<Id>();

  const { loading, confirmed, error, status, txHash, transfer, reset } = useSafeTransfer();

  useMemo(async () => {
    setGasFee(
      BigInt(await estimateSafeTransferFee(selectedWallet.deployed, selectedWallet.network))
    );
  }, [selectedWallet]);

  useMemo(async () => {
    if (!sendAmount || !selectedRecipient) {
      return;
    }

    if (loading) {
      sendToastId.current = toast.loading(
        <Box display="flex" flexDirection="row" alignItems="center" justifyContent="space-between">
          <ProfileSection profile={profile} />
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
            <ProfileSection profile={profile} />
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

      // if tx was successfull, mark wallet as deployed if it wasn't
      if (!selectedWallet.deployed) {
        selectedWallet.deployed = true;
        updateWallet(flow.uuid, selectedWallet);
      }
    } else if (error) {
      toast.update(sendToastId.current, {
        render: (
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            <ProfileSection profile={profile} />
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

  const sendTransaction = async () => {
    if (selectedRecipient && sendAmount && ethersSigner) {
      if (!toAddress) {
        toast.error("Can't send to this profile");
        return;
      }

      await reset();

      const txData = {
        from: selectedWallet.address,
        to: toAddress,
        amount: sendAmount
      };

      const safeAccountConfig: SafeAccountConfig = {
        owners: [profile.address],
        threshold: 1
      };

      const saltNonce = flow.saltNonce as string;
      const safeVersion = selectedWallet.version as SafeVersion;

      transfer(ethersSigner, txData, safeAccountConfig, safeVersion, saltNonce);
    }
  };

  useMemo(() => {
    setSendAmount(undefined);
    if (selectedRecipient) {
      switchNetwork?.(selectedWallet.network);
    }
  }, [selectedWallet, selectedRecipient]);

  useMemo(async () => {
    if (!selectedRecipient) {
      setToAddress(toAddress);
      return;
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

  function handleCloseSendDialog() {
    closeStateCallback();
  }

  return (
    <Dialog
      fullScreen={isMobile}
      onClose={handleCloseSendDialog}
      {...props}
      PaperProps={{ sx: { borderRadius: 5 } }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Stack alignItems="center">
          <Typography justifySelf="center" variant="h6">
            Send
          </Typography>
          <Typography justifySelf="center" variant="caption">
            from: "{flow.title}" flow
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
              onClick={async () => setOpenSearchProfile(true)}
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
            {selectedRecipient && (
              <Box width="100%" display="flex" flexDirection="column">
                <TextField
                  fullWidth
                  variant="outlined"
                  type="number"
                  inputProps={{ style: { textAlign: 'center', fontSize: 20 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconButton
                          sx={{ width: 40, height: 40, border: 1, borderStyle: 'dashed' }}
                          onClick={(event) => {
                            setWalletAnchorEl(event.currentTarget);
                            setOpenSelectWallet(true);
                          }}>
                          <NetworkAvatar
                            network={selectedWallet.network}
                            sx={{ width: 28, height: 28 }}
                          />
                        </IconButton>
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
                            {`${sendAmount ? parseFloat(formatEther(sendAmount)).toPrecision(3) : 0}
                        ETH`}
                          </Typography>
                        </Box>
                      </InputAdornment>
                    ),
                    inputMode: 'decimal',
                    sx: { borderRadius: 5, height: 56 }
                  }}
                  onChange={(event) => {
                    const amountUSD = parseFloat(event.target.value);
                    if (ethUsdPrice && amountUSD >= 1) {
                      const amount = parseEther((amountUSD / ethUsdPrice).toString());

                      if (balance && amount <= balance?.value && amountUSD >= 1) {
                        setSendAmount(amount);
                        return;
                      }
                    }
                    setSendAmount(undefined);
                  }}
                />

                <Box
                  display="flex"
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center">
                  <Stack ml={0.5} direction="row" spacing={0.5} alignItems="center">
                    <AttachMoney fontSize="small" />
                    <Typography variant="caption">
                      {`max: ${
                        isSuccess ? balance && parseFloat(formatEther(balance.value)).toFixed(5) : 0
                      } ETH ≈ $${
                        isSuccess
                          ? balance &&
                            (parseFloat(formatEther(balance.value)) * (ethUsdPrice ?? 0)).toFixed(2)
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
                {gasFee !== undefined && (
                  <Stack ml={0.5} direction="row" spacing={0.5} alignItems="center">
                    <Tooltip
                      title="Gas is paid by the sending flow wallet via Gelato SyncFee call method. 
                    The fee includes Gelato on-chain call, safe tx fee + deployment fee on the first tx, and 10% Gelato's comission on top of all.">
                      <LocalGasStation fontSize="small" />
                    </Tooltip>
                    <Typography ml={1} variant="caption">
                      {`fee: ${parseFloat(formatEther(gasFee)).toFixed(5)} ETH ≈ $${(
                        parseFloat(formatEther(gasFee)) * (ethUsdPrice ?? 0)
                      ).toFixed(2)}`}
                    </Typography>
                  </Stack>
                )}
              </Box>
            )}
          </Stack>
          {selectedRecipient &&
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
                onClick={sendTransaction}
                sx={{ mt: 3, mb: 1, borderRadius: 5 }}>
                Send
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
      </DialogContent>
      <ChooseWalletMenu
        anchorEl={walletAnchorEl}
        open={openSelectWallet}
        closeStateCallback={() => {
          setOpenSelectWallet(false);
        }}
        // in case a new wallet chain added, not all users maybe be compatible, limit by chains recipient supports
        wallets={
          selectedRecipient?.type === 'profile'
            ? flow.wallets.filter((w) =>
                selectedRecipient?.data.profile?.defaultFlow?.wallets.find(
                  (rw) => rw.network === w.network
                )
              )
            : flow.wallets
        }
        selectedWallet={selectedWallet}
        setSelectedWallet={setSelectedWallet}
      />
      <SearchProfileDialog
        open={openSearchProfile}
        closeStateCallback={() => {
          setOpenSearchProfile(false);
        }}
        selectProfileCallback={(selectedProfileWithSocials) => {
          setSelectedRecipient(selectedProfileWithSocials);
        }}
      />
    </Dialog>
  );
}
