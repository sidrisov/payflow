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
  InputAdornment,
  Chip,
  CircularProgress,
  Tooltip
} from '@mui/material';

import { CloseCallbackType } from '../types/CloseCallbackType';
import { useContext, useMemo, useRef, useState } from 'react';
import { useBalance, useNetwork, useSwitchNetwork } from 'wagmi';
import { AddComment, ArrowForward, Close, ExpandMore } from '@mui/icons-material';
import { Id, toast } from 'react-toastify';

import { Address, Hash, formatEther, parseEther } from 'viem';

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

  const { profile, ethUsdPrice } = useContext(UserContext);

  const ethersSigner = useEthersSigner();

  const { switchNetwork, isLoading: isSwitchNetworkLoading } = useSwitchNetwork();
  const { chain } = useNetwork();

  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>(
    flow.wallets.find((w) => w.network === chain?.id) ?? flow.wallets[0]
  );
  const [selectedRecipient, setSelectedRecipient] = useState<SelectedProfileWithSocialsType>();

  const [toAddress, setToAddress] = useState<Address>();
  const [sendAmount, setSendAmount] = useState<bigint>();

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
      if (!selectedWallet.safeDeployed) {
        selectedWallet.safeDeployed = true;
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

      const saltNonce = selectedWallet.safeSaltNonce as Hash;
      const safeVersion = selectedWallet.safeVersion as SafeVersion;

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
      fullScreen={fullScreen}
      onClose={handleCloseSendDialog}
      {...props}
      PaperProps={{ sx: { borderRadius: 5 } }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Stack direction="column" alignItems="center">
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
          minWidth: 350,
          maxWidth: fullScreen ? 600 : 350
        }}>
        <Stack direction="column" spacing={2} alignItems="center">
          <Divider />
          <Box
            display="flex"
            flexDirection="row"
            alignSelf="stretch"
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
              {selectedRecipient && selectedRecipient.type === 'profile' && (
                <Chip
                  size="small"
                  variant="filled"
                  label="payflow"
                  sx={{ background: 'lightgreen' }}
                />
              )}
              <ExpandMore />
            </Stack>
          </Box>
          {selectedRecipient && (
            <>
              <Box display="flex" flexDirection="column">
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
                          width={150}>
                          <Typography>$</Typography>
                          <Typography>≈</Typography>
                          <Typography>
                            {`${sendAmount ? parseFloat(formatEther(sendAmount)).toPrecision(2) : 0}
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
                  <Typography ml={1} variant="caption">
                    {`max: ${
                      isSuccess
                        ? balance && parseFloat(formatEther(balance?.value)).toPrecision(2)
                        : 0
                    } ETH ≈ $${
                      isSuccess
                        ? balance &&
                          (
                            parseFloat(formatEther(balance?.value)) * (ethUsdPrice ?? 0)
                          ).toPrecision(2)
                        : 0.0
                    }`}
                  </Typography>
                  <Tooltip title="Add a note">
                    <IconButton
                      size="small"
                      color="inherit"
                      sx={{ mr: 1, alignSelf: 'flex-end' }}
                      onClick={() => {
                        comingSoonToast();
                      }}>
                      <AddComment fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Divider />
              {chain?.id === selectedWallet.network ? (
                <LoadingButton
                  loading={loading || (txHash && !confirmed && !error)}
                  disabled={!(toAddress && sendAmount)}
                  fullWidth
                  variant="outlined"
                  loadingIndicator={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress color="inherit" size={16} />
                      <Typography variant="button">{status}</Typography>
                    </Stack>
                  }
                  size="medium"
                  color="primary"
                  onClick={sendTransaction}
                  sx={{ mt: 1, borderRadius: 5 }}>
                  Send
                </LoadingButton>
              ) : (
                <LoadingButton
                  fullWidth
                  loading={isSwitchNetworkLoading}
                  variant="outlined"
                  size="medium"
                  color="primary"
                  onClick={() => {
                    switchNetwork?.(selectedWallet.network);
                  }}
                  sx={{ mt: 1, borderRadius: 5 }}>
                  Switch Network
                </LoadingButton>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <ChooseWalletMenu
        anchorEl={walletAnchorEl}
        open={openSelectWallet}
        closeStateCallback={() => {
          setOpenSelectWallet(false);
        }}
        wallets={flow.wallets}
        selectedWallet={selectedWallet}
        setSelectedWallet={setSelectedWallet}
      />
      <SearchProfileDialog
        open={openSearchProfile}
        closeStateCallback={() => {
          setOpenSearchProfile(false);
        }}
        selectProfileWithSocialsCallback={(selectedProfileWithSocials) => {
          setSelectedRecipient(selectedProfileWithSocials);
        }}
      />
    </Dialog>
  );
}
