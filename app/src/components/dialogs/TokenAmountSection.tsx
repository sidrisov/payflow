import { Typography, Stack, Box, TextField, Button, InputAdornment } from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { AttachMoney, PriorityHigh } from '@mui/icons-material';
import { formatUnits, parseUnits } from 'viem';
import { FlowWalletType } from '../../types/FlowType';
import { red } from '@mui/material/colors';
import { NetworkSelectorButton } from '../buttons/NetworkSelectorButton';
import { ProfileContext } from '../../contexts/UserContext';
import { TokenSelectorButton } from '../buttons/TokenSelectorButton';
import { ETH, Token } from '../../utils/erc20contracts';
import { normalizeNumberPrecision } from '../../utils/normalizeNumberPrecision';

export function TokenAmountSection({
  selectedWallet,
  setSelectedWallet,
  compatibleWallets,
  compatibleTokens,
  selectedToken,
  setSelectedToken,
  sendAmount,
  setSendAmount
}: {
  selectedWallet: FlowWalletType;
  setSelectedWallet: React.Dispatch<React.SetStateAction<FlowWalletType | undefined>>;
  compatibleWallets: FlowWalletType[];
  compatibleTokens: Token[];
  selectedToken: Token;
  setSelectedToken: React.Dispatch<React.SetStateAction<Token | undefined>>;
  sendAmount?: bigint;
  setSendAmount: React.Dispatch<React.SetStateAction<bigint | undefined>>;
  sendAmountUSD?: number;
  setSendAmountUSD: React.Dispatch<React.SetStateAction<number | undefined>>;
}) {
  const { chain } = useAccount();

  const { tokenPrices } = useContext(ProfileContext);

  const [balanceEnough, setBalanceEnough] = useState<boolean>();
  const [minAmountSatisfied, setMinAmountSatisfied] = useState<boolean>();

  const [maxBalance, setMaxBalance] = useState<string>('0.0');
  const [maxBalanceUsd, setMaxBalanceUsd] = useState<string>('0.0');
  const [selectedTokenPrice, setSelectedTokenPrice] = useState<number>();

  const [sendAmountUSD, setSendAmountUSD] = useState<number>();

  const { isSuccess, data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId: chain?.id,
    token: selectedToken !== ETH ? selectedToken?.address : undefined,
    query: {
      enabled: selectedWallet !== undefined && selectedToken != undefined,
      gcTime: 5000
    }
  });

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
    <Box width="100%" display="flex" flexDirection="column">
      <Box
        px={1}
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ borderRadius: 5, border: 1, height: 56 }}>
        <NetworkSelectorButton
          selectedWallet={selectedWallet}
          setSelectedWallet={setSelectedWallet}
          wallets={compatibleWallets}
        />
        <TextField
          fullWidth
          variant="standard"
          type="number"
          value={sendAmountUSD}
          error={
            sendAmountUSD !== undefined && (minAmountSatisfied === false || balanceEnough === false)
          }
          inputProps={{
            style: {
              minWidth: 55,
              maxWidth: 65,
              textAlign: 'start',
              fontWeight: 'bold',
              fontSize: 16
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography ml={1} fontSize={16} fontWeight="bold">
                  $
                </Typography>
              </InputAdornment>
            ),
            inputMode: 'decimal',
            disableUnderline: true
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
        <Box
          minWidth={170}
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between">
          <Typography mx={1} fontSize={14} fontWeight="bold">
            ≈
          </Typography>
          <Typography
            fontSize={14}
            fontWeight="bold"
            textOverflow="ellipsis"
            overflow="auto"
            textAlign="center">
            {`${normalizeNumberPrecision(
              sendAmount && balance ? parseFloat(formatUnits(sendAmount, balance.decimals)) : 0
            )}
                        ${selectedToken.name}`}
          </Typography>
          <Button
            variant="text"
            size="small"
            color="inherit"
            onClick={() => setSendAmountUSD(Number.parseInt(maxBalanceUsd))}
            sx={{
              mx: 0.5,
              minWidth: 35,
              maxWidth: 40,
              borderRadius: 5,
              fontSize: 15,
              fontWeight: 'bold',
              textTransform: 'none'
            }}>
            max
          </Button>
        </Box>
        <TokenSelectorButton
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
          tokens={compatibleTokens}
        />
      </Box>
      {sendAmountUSD !== undefined && (minAmountSatisfied === false || balanceEnough === false) && (
        <Stack ml={0.5} mt={0.5} direction="row" spacing={0.5} alignItems="center">
          <PriorityHigh fontSize="small" sx={{ color: red.A400 }} />
          <Typography ml={1} variant="caption" color={red.A400}>
            {sendAmountUSD !== undefined &&
              ((minAmountSatisfied === false && 'min: $1') ||
                (balanceEnough === false && 'balance: not enough'))}
          </Typography>
        </Stack>
      )}

      <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="center">
        <Stack ml={0.5} direction="row" spacing={0.5} alignItems="center">
          <AttachMoney fontSize="small" />
          <Typography variant="caption">
            {`max: $${maxBalanceUsd} ≈ ${maxBalance} ${selectedToken?.name}`}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
