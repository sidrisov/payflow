import {
  Typography,
  Stack,
  Box,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Chip
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import {
  ExpandLess,
  ExpandMore,
  PriorityHigh,
  Token as NetworkToken,
  SwapVert
} from '@mui/icons-material';
import { formatUnits, parseUnits } from 'viem';
import { FlowWalletType } from '../../types/FlowType';
import { grey, red } from '@mui/material/colors';
import { NetworkSelectorButton } from '../buttons/NetworkSelectorButton';
import { TokenSelectorButton } from '../buttons/TokenSelectorButton';
import { ETH, Token, getSupportedTokens } from '../../utils/erc20contracts';
import { normalizeNumberPrecision } from '../../utils/normalizeNumberPrecision';
import { useTokenPrices } from '../../utils/queries/prices';
import { PaymentType } from '../../types/PaymentType';
import { getNetworkDisplayName } from '../../utils/networks';
import { GasFeeSection } from './GasFeeSection';
import { comingSoonToast } from '../Toasts';

export function TokenAmountSection({
  payment,
  selectedWallet,
  setSelectedWallet,
  compatibleWallets,
  selectedToken,
  setSelectedToken,
  sendAmount,
  setSendAmount,
  sendAmountUSD,
  setSendAmountUSD
}: {
  payment?: PaymentType;
  selectedWallet: FlowWalletType;
  setSelectedWallet: React.Dispatch<React.SetStateAction<FlowWalletType | undefined>>;
  compatibleWallets: FlowWalletType[];
  selectedToken?: Token;
  setSelectedToken: React.Dispatch<React.SetStateAction<Token | undefined>>;
  sendAmount?: bigint;
  setSendAmount: React.Dispatch<React.SetStateAction<bigint | undefined>>;
  sendAmountUSD?: number;
  setSendAmountUSD: React.Dispatch<React.SetStateAction<number | undefined>>;
}) {
  const { chain } = useAccount();

  const { data: tokenPrices } = useTokenPrices();

  const [balanceEnough, setBalanceEnough] = useState<boolean>();
  const [minAmountSatisfied, setMinAmountSatisfied] = useState<boolean>();

  const [maxBalance, setMaxBalance] = useState<string>('0.0');
  const [maxBalanceUsd, setMaxBalanceUsd] = useState<string>('0.0');
  const [selectedTokenPrice, setSelectedTokenPrice] = useState<number>();

  const [compatibleTokens, setCompatibleTokens] = useState<Token[]>([]);
  const [expand, setExpand] = useState<boolean>(false);

  // force to display sponsored
  const [gasFee] = useState<bigint>(BigInt(0));

  const { isSuccess, data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId: chain?.id,
    token: selectedToken !== ETH ? selectedToken?.address : undefined,
    query: {
      enabled: selectedWallet !== undefined && selectedToken !== undefined,
      gcTime: 5000
    }
  });

  useEffect(() => {
    // don't update if selected token was already selected
    if (selectedToken && compatibleTokens.find((t) => t === selectedToken)) {
      return;
    }

    setSelectedToken(compatibleTokens[0]);
  }, [selectedToken, compatibleTokens, chain]);

  useMemo(() => {
    // filter by passed token if available
    const tokens = getSupportedTokens(selectedWallet.network).filter((t) =>
      payment?.token ? t.name.toLowerCase() === payment.token : true
    );
    setCompatibleTokens(tokens);
  }, [selectedWallet]);

  useMemo(async () => {
    if (selectedToken && tokenPrices) {
      const price = tokenPrices[selectedToken.name];
      setSelectedTokenPrice(price);
    } else {
      setSelectedTokenPrice(undefined);
    }
  }, [selectedToken, tokenPrices]);

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

  useEffect(() => {
    if (sendAmountUSD !== undefined && selectedToken && balance && tokenPrices) {
      const tokenPrice = tokenPrices[selectedToken.name] ?? 0;
      const amount = parseUnits((sendAmountUSD / tokenPrice).toString(), balance.decimals);

      const balanceEnough = balance && amount <= balance?.value;
      const minAmount = sendAmountUSD >= 0.1;

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
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      height="100%">
      <Box
        m={1}
        mt={3}
        display="flex"
        flexDirection="row"
        justifyContent="space-evenly"
        alignItems="center">
        {!payment?.token && (
          <IconButton
            size="small"
            sx={{ color: grey[400] }}
            onClick={() => {
              comingSoonToast();
            }}>
            <SwapVert fontSize="small" />
          </IconButton>
        )}
        <Stack ml={3} alignItems="center">
          <TextField
            autoFocus
            focused
            variant="standard"
            type="number"
            value={sendAmountUSD}
            error={
              sendAmountUSD !== undefined &&
              (minAmountSatisfied === false || balanceEnough === false)
            }
            inputProps={{
              style: {
                minWidth: 55,
                maxWidth: 85,
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: 30
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography fontSize={25} fontWeight="bold">
                    $
                  </Typography>
                </InputAdornment>
              ),
              inputMode: 'decimal',
              disableUnderline: true
            }}
            onChange={async (event) => {
              // don't allow changing amount if passed
              if (payment?.usdAmount) {
                return;
              }

              if (event.target.value) {
                const amountUSD = parseFloat(event.target.value);
                setSendAmountUSD(amountUSD);
              } else {
                setSendAmountUSD(undefined);
              }
            }}
          />
          <Typography
            mx={0.5}
            fontSize={14}
            fontWeight="bold"
            textOverflow="ellipsis"
            overflow="auto"
            textAlign="center">
            {`${normalizeNumberPrecision(
              sendAmount && balance ? parseFloat(formatUnits(sendAmount, balance.decimals)) : 0
            )}
                        ${selectedToken?.name}`}
          </Typography>
          {sendAmountUSD !== undefined &&
            (minAmountSatisfied === false || balanceEnough === false) && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <PriorityHigh fontSize="small" sx={{ color: red.A400 }} />
                <Typography ml={1} variant="caption" color={red.A400}>
                  {sendAmountUSD !== undefined &&
                    ((minAmountSatisfied === false && 'min: $0.1') ||
                      (balanceEnough === false && 'balance: not enough'))}
                </Typography>
              </Stack>
            )}
        </Stack>

        {!payment?.token && (
          <Button
            variant="text"
            size="small"
            onClick={async () => setSendAmountUSD(Number.parseInt(maxBalanceUsd))}
            sx={{
              borderRadius: 5,
              fontWeight: 'bold',
              textTransform: 'none',
              color: grey[400]
            }}>
            max
          </Button>
        )}
      </Box>

      <Stack>
        <Box
          px={1}
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center">
          <Chip
            icon={<NetworkToken fontSize="small" />}
            label="Network & Token"
            variant="outlined"
            sx={{ border: 0, fontSize: 14, fontWeight: 'bold' }}
          />
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="subtitle2">
              {getNetworkDisplayName(selectedWallet.network)} / {selectedToken?.name}
            </Typography>
            <IconButton size="small" onClick={() => setExpand(!expand)}>
              {expand ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          </Stack>
        </Box>

        {expand && (
          <>
            <Box
              py={1}
              px={2}
              display="flex"
              flexDirection="column"
              alignItems="stretch"
              justifyContent="flex-start"
              gap={0.5}
              sx={{ borderRadius: 5, border: 1, borderColor: 'divider' }}>
              <Box
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center">
                <Typography variant="caption">Network</Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="caption">
                    {getNetworkDisplayName(selectedWallet.network)}
                  </Typography>
                  <NetworkSelectorButton
                    selectedWallet={selectedWallet}
                    setSelectedWallet={setSelectedWallet}
                    wallets={compatibleWallets}
                  />
                </Stack>
              </Box>

              <Box
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center">
                <Typography variant="caption">Token</Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="caption">{selectedToken?.name}</Typography>
                  <TokenSelectorButton
                    selectedToken={selectedToken}
                    setSelectedToken={setSelectedToken}
                    tokens={compatibleTokens}
                  />
                </Stack>
              </Box>

              <Box
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center">
                <Typography variant="caption">Available</Typography>
                <Typography variant="caption">
                  {`${maxBalance} ${selectedToken?.name} ≈ $${maxBalanceUsd}`}
                </Typography>
              </Box>
              <GasFeeSection selectedToken={selectedToken} gasFee={gasFee} />
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}
