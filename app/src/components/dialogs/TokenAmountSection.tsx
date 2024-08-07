import {
  Typography,
  Stack,
  Box,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  styled
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { PriorityHigh, SwapVert } from '@mui/icons-material';
import { formatUnits, parseUnits } from 'viem';
import { FlowWalletType } from '../../types/FlowType';
import { grey, red } from '@mui/material/colors';
import { Token } from '../../utils/erc20contracts';
import { normalizeNumberPrecision } from '../../utils/formats';
import { useTokenPrices } from '../../utils/queries/prices';
import { PaymentType } from '../../types/PaymentType';

const TokenAmountTextField = styled(TextField)(() => ({
  '& .MuiInputBase-input::placeholder': {
    paddingLeft: '15px'
  }
}));

export function TokenAmountSection({
  payment,
  selectedWallet,
  selectedToken,
  sendAmount,
  setSendAmount,
  sendAmountUSD,
  setSendAmountUSD,
  balanceCheck = true
}: {
  payment?: PaymentType;
  selectedWallet: FlowWalletType;
  selectedToken?: Token;
  sendAmount?: number;
  setSendAmount: React.Dispatch<React.SetStateAction<number | undefined>>;
  sendAmountUSD?: number;
  setSendAmountUSD: React.Dispatch<React.SetStateAction<number | undefined>>;
  balanceCheck?: boolean;
}) {
  const { chain } = useAccount();

  const { data: tokenPrices } = useTokenPrices();

  const [balanceEnough, setBalanceEnough] = useState<boolean>();

  const [selectedTokenPrice, setSelectedTokenPrice] = useState<number>();

  const [usdAmountMode, setUsdAmountMode] = useState<boolean>(Boolean(payment?.usdAmount));

  const { data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId: chain?.id,
    token: selectedToken?.tokenAddress,
    query: {
      enabled: balanceCheck && selectedWallet !== undefined && selectedToken !== undefined,
      gcTime: 5000
    }
  });

  useMemo(async () => {
    if (selectedToken && tokenPrices) {
      const price = tokenPrices[selectedToken.id];
      setSelectedTokenPrice(price);
    } else {
      setSelectedTokenPrice(undefined);
    }
  }, [selectedToken, tokenPrices]);

  useEffect(() => {
    if (selectedToken && selectedTokenPrice && (!balanceCheck || balance)) {
      if (usdAmountMode === true && sendAmountUSD !== undefined) {
        const amount = parseUnits(
          (sendAmountUSD / selectedTokenPrice).toString(),
          selectedToken.decimals
        );
        const balanceEnough = !balanceCheck ? true : amount <= (balance?.value ?? 0);

        setBalanceEnough(balanceEnough);
        if (balanceEnough) {
          setSendAmount(parseFloat(formatUnits(amount, selectedToken.decimals)));
        } else {
          setSendAmount(undefined);
        }
      }

      if (usdAmountMode === false && sendAmount !== undefined) {
        const usdAmount = sendAmount * selectedTokenPrice;
        const balanceEnough = !balanceCheck
          ? true
          : parseUnits(sendAmount.toString(), selectedToken.decimals) <= (balance?.value ?? 0);

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
    balanceCheck,
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
      height="100%"
      display="flex"
      flexDirection="column"
      justifyContent="space-between">
      <Stack mx={1} alignItems="center">
        <Box
          m={1}
          mt={3}
          display="flex"
          flexDirection="row"
          justifyContent="space-evenly"
          alignItems="center">
          {!payment?.token && balanceCheck && <Box width={65} />}
          <TokenAmountTextField
            // don't auto focus if it's pending payment
            {...(!payment?.token && !sendAmount && { autoFocus: true, focused: true })}
            variant="standard"
            type="number"
            placeholder="0"
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
                          {selectedToken?.id.toUpperCase()}
                        </Typography>
                      </InputAdornment>
                    )
                  }),
              inputMode: 'decimal',
              disableUnderline: true
            }}
            onChange={async (event) => {
              // don't allow changing amount if passed
              if (payment?.usdAmount || payment?.tokenAmount) {
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

          {!payment?.token && selectedToken && balanceCheck && (
            <Button
              variant="text"
              size="small"
              onClick={async () => {
                if (balance && selectedTokenPrice) {
                  const maxAmount = parseFloat(formatUnits(balance.value, selectedToken.decimals));
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
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography
              fontSize={14}
              fontWeight="bold"
              textOverflow="ellipsis"
              overflow="auto"
              textAlign="center">
              {usdAmountMode
                ? `${normalizeNumberPrecision(sendAmount ?? 0)} ${selectedToken?.id.toUpperCase()}`
                : `$ ${normalizeNumberPrecision(sendAmountUSD ?? 0)}`}
            </Typography>
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
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
