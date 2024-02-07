import {
  Typography,
  Stack,
  Box,
  IconButton,
  TextField,
  Button,
  InputAdornment,
  Tooltip
} from '@mui/material';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { AddComment, AttachMoney, ExpandMore, PriorityHigh } from '@mui/icons-material';
import { Id, toast } from 'react-toastify';

import { Address, erc20Abi, formatUnits, parseUnits } from 'viem';

import { FlowWalletType } from '../../types/FlowType';
import { IdentityType } from '../../types/ProfleType';
import { ProfileSection } from '../ProfileSection';
import { AddressSection } from '../AddressSection';
import { comingSoonToast } from '../Toasts';
import { PayflowChip } from '../chips/IdentityStatusChips';
import { red } from '@mui/material/colors';
import { NetworkSelectorButton } from '../buttons/NetworkSelectorButton';
import { TransferToastContent } from '../toasts/TransferToastContent';
import { LoadingSwitchNetworkButton } from '../buttons/LoadingSwitchNetworkButton';
import { useRegularTransfer } from '../../utils/hooks/useRegularTransfer';
import { SUPPORTED_CHAINS } from '../../utils/networks';
import { ProfileContext } from '../../contexts/UserContext';
import { LoadingPaymentButton } from '../buttons/LoadingPaymentButton';
import { PaymentDialogProps } from './PaymentDialog';
import { TokenSelectorButton } from '../buttons/TokenSelectorButton';
import { ETH, ETH_TOKEN, Token, getSupportedTokens } from '../../utils/erc20contracts';
import { normalizeNumberPrecision } from '../../utils/normalizeNumberPrecision';

export default function PayProfileDialog({ sender, recipient }: PaymentDialogProps) {
  const { tokenPrices } = useContext(ProfileContext);

  const { chain } = useAccount();

  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>();
  const [selectedToken, setSelectedToken] = useState<Token>();
  const [selectedTokenPrice, setSelectedTokenPrice] = useState<number>();
  const [compatibleWallets, setCompatibleWallets] = useState<FlowWalletType[]>([]);
  const [compatibleTokens, setCompatibleTokens] = useState<Token[]>([]);

  const [toAddress, setToAddress] = useState<Address>();
  const [sendAmountUSD, setSendAmountUSD] = useState<number>();
  const [sendAmount, setSendAmount] = useState<bigint>();
  const [balanceEnough, setBalanceEnough] = useState<boolean>();
  const [minAmountSatisfied, setMinAmountSatisfied] = useState<boolean>();
  const { isSuccess, data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId: chain?.id,
    token: selectedToken !== ETH ? selectedToken?.address : undefined,
    query: {
      enabled: selectedWallet !== undefined && selectedToken != undefined,
      gcTime: 5000
    }
  });

  const [maxBalance, setMaxBalance] = useState<string>('0.0');
  const [maxBalanceUsd, setMaxBalanceUsd] = useState<string>('0.0');

  useMemo(async () => {
    if (selectedTokenPrice) {
      const maxBalance =
        isSuccess && balance ? parseFloat(formatUnits(balance.value, balance.decimals)) : 0;

      const maxBalanceUsd =
        isSuccess && balance
          ? parseFloat(formatUnits(balance.value, balance.decimals)) * selectedTokenPrice
          : 0;

      setMaxBalance(normalizeNumberPrecision(maxBalance));
      setMaxBalanceUsd(normalizeNumberPrecision(maxBalanceUsd));
    }
  }, [isSuccess, balance, selectedTokenPrice]);

  const sendToastId = useRef<Id>();

  const { loading, confirmed, error, status, txHash, sendTransaction, writeContract, reset } =
    useRegularTransfer();

  useMemo(async () => {
    if (selectedToken && tokenPrices) {
      const price = tokenPrices[selectedToken.name];
      setSelectedTokenPrice(price);
    } else {
      setSelectedTokenPrice(undefined);
    }
  }, [selectedToken, tokenPrices]);

  useEffect(() => {
    if (!recipient || !(sender as Address)) {
      setSelectedWallet(undefined);
      setCompatibleWallets([]);
      return;
    }

    const compatibleSenderWallets =
      recipient.type === 'address'
        ? SUPPORTED_CHAINS.map(
            (c) => ({ address: sender as Address, network: c.id } as FlowWalletType)
          )
        : recipient.identity.profile?.defaultFlow?.wallets.map(
            (wallet) => ({ address: sender as Address, network: wallet.network } as FlowWalletType)
          ) ?? [];

    setCompatibleWallets(compatibleSenderWallets);

    console.debug('compatible sender wallets: ', compatibleSenderWallets);

    if (compatibleSenderWallets.length === 0) {
      toast.error('No compatible wallets available!');
      return;
    }
  }, [sender]);

  useEffect(() => {
    const wallet =
      (chain && compatibleWallets.find((w) => w.network === chain.id)) ?? compatibleWallets[0];
    setSelectedWallet(wallet);
    console.debug('selected sender wallet: ', wallet);
  }, [compatibleWallets, chain]);

  useEffect(() => {
    setSelectedToken(compatibleTokens[0]);
  }, [compatibleTokens, chain]);

  useMemo(() => {
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

    const tokens = getSupportedTokens(selectedWallet.network);
    setCompatibleTokens(tokens);
  }, [selectedWallet]);

  useMemo(async () => {
    if (!sendAmount || !recipient || !selectedWallet) {
      return;
    }

    if (loading && !sendToastId.current) {
      toast.dismiss();
      sendToastId.current = toast.loading(
        <TransferToastContent
          from={{ type: 'address', identity: { address: sender as Address } as IdentityType }}
          to={recipient}
          usdAmount={sendAmountUSD ?? 0}
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
            from={{ type: 'address', identity: { address: sender as Address } as IdentityType }}
            to={recipient}
            usdAmount={sendAmountUSD ?? 0}
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
            from={{ type: 'address', identity: { address: sender as Address } as IdentityType }}
            to={recipient}
            usdAmount={sendAmountUSD ?? 0}
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
    if (sendAmountUSD !== undefined && selectedToken && balance && tokenPrices) {
      const tokenPrice = tokenPrices[selectedToken.name] ?? 0;
      const amount = parseUnits((sendAmountUSD / tokenPrice).toString(), balance.decimals);

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
  }, [sendAmountUSD, chain?.id, balance, tokenPrices]);

  return (
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
        {recipient && selectedWallet && selectedToken && (
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
                      minWidth={200}>
                      <Typography>$</Typography>
                      <Typography>≈</Typography>
                      <Typography>
                        {`${normalizeNumberPrecision(
                          sendAmount && balance
                            ? parseFloat(formatUnits(sendAmount, balance.decimals))
                            : 0
                        )}
                        ${selectedToken.name}`}
                      </Typography>
                      <TokenSelectorButton
                        selectedToken={selectedToken}
                        setSelectedToken={setSelectedToken}
                        tokens={compatibleTokens}
                      />
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
                  {`max: ${maxBalance} ${selectedToken?.name} ≈ $${maxBalanceUsd}`}
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
          <LoadingPaymentButton
            title="Pay"
            status={status}
            loading={loading || (txHash && !confirmed && !error)}
            disabled={!(toAddress && sendAmount)}
            onClick={() => {
              if (!toAddress || !sendAmount || !selectedToken || !selectedToken) {
                return;
              }

              if (selectedToken.name === ETH_TOKEN) {
                sendTransaction?.({ to: toAddress, value: sendAmount });
              } else {
                writeContract?.({
                  abi: erc20Abi,
                  address: selectedToken.address,
                  functionName: 'transfer',
                  args: [toAddress, sendAmount]
                });
              }
            }}
          />
        ) : (
          <LoadingSwitchNetworkButton chainId={selectedWallet.network} />
        ))}
    </>
  );
}
