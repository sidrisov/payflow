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
  sendAmount?: number;
  setSendAmount: React.Dispatch<React.SetStateAction<number | undefined>>;
  sendAmountUSD?: number;
  setSendAmountUSD: React.Dispatch<React.SetStateAction<number | undefined>>;
}) {
  const { chain } = useAccount();

  const { data: tokenPrices } = useTokenPrices();

  const [balanceEnough, setBalanceEnough] = useState<boolean>();

  const [maxBalance, setMaxBalance] = useState<string>('0.0');
  const [maxBalanceUsd, setMaxBalanceUsd] = useState<string>('0.0');
  const [selectedTokenPrice, setSelectedTokenPrice] = useState<number>();

  const [compatibleTokens, setCompatibleTokens] = useState<Token[]>([]);
  const [expand, setExpand] = useState<boolean>(false);

  const [usdAmountMode, setUsdAmountMode] = useState<boolean>(true);

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
    console.log('here!!!');
    console.log(selectedToken, balance, selectedTokenPrice);
    if (selectedToken && balance && selectedTokenPrice) {
      console.log('here2!!!', sendAmount, sendAmountUSD);

      if (usdAmountMode === true && sendAmountUSD !== undefined) {
        console.log('here3!!!');

        const amount = parseUnits(
          (sendAmountUSD / selectedTokenPrice).toString(),
          balance.decimals
        );
        const balanceEnough = amount <= balance.value;

        console.log(balance);

        setBalanceEnough(balanceEnough);
        if (balanceEnough) {
          setSendAmount(parseFloat(formatUnits(amount, balance.decimals)));
        } else {
          setSendAmount(undefined);
        }
      }

      if (usdAmountMode === false && sendAmount !== undefined) {
        console.log('here4!!!');

        const usdAmount = sendAmount * selectedTokenPrice;
        const balanceEnough = parseUnits(sendAmount.toString(), balance.decimals) <= balance.value;

        setBalanceEnough(balanceEnough);
        if (balanceEnough) {
          setSendAmountUSD(parseFloat(normalizeNumberPrecision(usdAmount)));
        } else {
          setSendAmountUSD(undefined);
        }
      }

      return;
    }

    setBalanceEnough(undefined);
  }, [
    usdAmountMode,
    sendAmountUSD,
    sendAmount,
    chain?.id,
    selectedToken,
    balance,
    selectedTokenPrice
  ]);

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      height="100%">
      <Stack mx={1} alignItems="center">
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
              onClick={async () => {
                setUsdAmountMode(!usdAmountMode);
              }}>
              <SwapVert fontSize="small" />
            </IconButton>
          )}
          <TextField
            // don't auto focus if it's pending payment
            {...(!payment?.token && { autoFocus: true, focused: true })}
            variant="standard"
            type="number"
            value={usdAmountMode ? sendAmountUSD : sendAmount}
            error={
              (usdAmountMode ? sendAmountUSD !== undefined : sendAmount !== undefined) &&
              balanceEnough === false
            }
            inputProps={{
              style: {
                maxWidth: 150,
                fontWeight: 'bold',
                fontSize: 30,
                alignSelf: 'center',
                textAlign: 'center'
              }
            }}
            InputProps={{
              ...(usdAmountMode
                ? {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography fontSize={20} fontWeight="bold">
                          $
                        </Typography>
                      </InputAdornment>
                    )
                  }
                : {
                    endAdornment: (
                      <InputAdornment position="start">
                        <Typography fontSize={20} fontWeight="bold">
                          {selectedToken?.name}
                        </Typography>
                      </InputAdornment>
                    )
                  }),
              inputMode: 'decimal',
              disableUnderline: true
            }}
            onChange={async (event) => {
              // don't allow changing amount if passed
              if (payment?.usdAmount) {
                return;
              }

              if (event.target.value) {
                const amount = parseFloat(event.target.value);
                if (usdAmountMode) {
                  setSendAmountUSD(amount);
                } else {
                  setSendAmount(amount);
                }
              } else {
                setSendAmountUSD(undefined);
                setSendAmount(undefined);
              }
            }}
            sx={{ border: 1, borderRadius: 10, borderColor: 'divider', px: 2, ml: 2, mr: 1 }}
          />

          {!payment?.token && (
            <Button
              variant="text"
              size="small"
              onClick={async () => {
                if (balance && selectedTokenPrice) {
                  const maxAmount = parseFloat(formatUnits(balance.value, balance.decimals));
                  if (usdAmountMode) {
                    setSendAmountUSD(
                      parseFloat(normalizeNumberPrecision(maxAmount * selectedTokenPrice))
                    );
                  } else {
                    setSendAmount(parseFloat(normalizeNumberPrecision(maxAmount)));
                  }
                } else {
                  setSendAmount(undefined);
                }
              }}
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

        {(usdAmountMode ? sendAmountUSD : sendAmount) && balanceEnough === false ? (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <PriorityHigh fontSize="small" sx={{ color: red.A400 }} />
            <Typography fontSize={14} fontWeight="bold" color={red.A400}>
              balance not enough
            </Typography>
          </Stack>
        ) : (
          <Typography
            fontSize={14}
            fontWeight="bold"
            textOverflow="ellipsis"
            overflow="auto"
            textAlign="center">
            {usdAmountMode
              ? `${normalizeNumberPrecision(sendAmount ?? 0)} ${selectedToken?.name}`
              : `$ ${normalizeNumberPrecision(sendAmountUSD ?? 0)}`}
          </Typography>
        )}
      </Stack>

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
