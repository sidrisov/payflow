import {
  Typography,
  Stack,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Skeleton
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useAssetBalance } from '../../utils/queries/balances';
import { formatUnits, parseUnits } from 'viem';
import { FlowWalletType } from '../../types/FlowType';
import { red } from '@mui/material/colors';
import { Token } from '@payflow/common';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { useTokenPrice } from '../../utils/queries/prices';
import { PaymentType } from '../../types/PaymentType';
import { MdMultipleStop } from 'react-icons/md';
import { FaCoins, FaDollarSign } from 'react-icons/fa6';
import { AssetType } from '../../types/AssetType';

export function TokenAmountSection({
  payment,
  crossChainMode = false,
  setCrossChainMode,
  setPaymentEnabled,
  selectedWallet,
  selectedToken,
  paymentAmount,
  setPaymentAmount,
  paymentAmountUSD,
  setPaymentAmountUSD,
  balanceCheck = true
}: {
  payment?: PaymentType;
  crossChainMode?: boolean;
  setCrossChainMode?: React.Dispatch<React.SetStateAction<boolean>>;
  setPaymentEnabled?: React.Dispatch<React.SetStateAction<boolean>>;
  selectedWallet: FlowWalletType | undefined;
  selectedToken?: Token;
  paymentAmount?: number;
  setPaymentAmount: React.Dispatch<React.SetStateAction<number | undefined>>;
  paymentAmountUSD?: number;
  setPaymentAmountUSD: React.Dispatch<React.SetStateAction<number | undefined>>;
  crossChainPaymentAmount?: number;
  setCrossChainPaymentAmount?: React.Dispatch<React.SetStateAction<number | undefined>>;
  balanceCheck?: boolean;
}) {
  const { data: tokenPrice } = useTokenPrice(selectedToken);

  const [balanceEnough, setBalanceEnough] = useState<boolean>();

  const [selectedTokenPrice, setSelectedTokenPrice] = useState<number>();

  const [usdAmountMode, setUsdAmountMode] = useState<boolean>(Boolean(payment?.usdAmount));

  const [inputValue, setInputValue] = useState<string>('');

  const { isFetched: isBalanceFetched, data: paymentTokenBalance } = useAssetBalance(
    balanceCheck && selectedToken
      ? ({
          address: selectedWallet?.address,
          chainId: selectedToken?.chainId,
          token: selectedToken
        } as AssetType)
      : undefined
  );

  useEffect(() => {
    if (selectedToken && tokenPrice) {
      setSelectedTokenPrice(tokenPrice);
    } else {
      setSelectedTokenPrice(undefined);
    }

    if (!payment?.token) {
      setPaymentAmount(undefined);
      setPaymentAmountUSD(undefined);
      setInputValue('');
    }
  }, [selectedToken, tokenPrice, payment]);

  useEffect(() => {
    if (crossChainMode) {
      return;
    }

    console.log(
      'updating amount: ',
      crossChainMode,
      usdAmountMode,
      paymentAmount,
      paymentAmountUSD
    );

    let balanceEnough: boolean | undefined;
    if (selectedToken && selectedTokenPrice && (!balanceCheck || paymentTokenBalance)) {
      if (usdAmountMode === true && paymentAmountUSD !== undefined) {
        const rawTokenAmount = paymentAmountUSD / selectedTokenPrice;
        const amount = parseUnits(
          rawTokenAmount.toFixed(selectedToken.decimals),
          selectedToken.decimals
        );

        balanceEnough =
          !balanceCheck || crossChainMode
            ? true
            : amount <= (paymentTokenBalance?.balance?.value ?? 0);
        setPaymentAmount(parseFloat(formatUnits(amount, selectedToken.decimals)));
      }
      if (usdAmountMode === false && paymentAmount !== undefined) {
        const usdAmount = paymentAmount * selectedTokenPrice;
        balanceEnough =
          !balanceCheck || crossChainMode
            ? true
            : parseUnits(paymentAmount.toFixed(selectedToken.decimals), selectedToken.decimals) <=
              (paymentTokenBalance?.balance?.value ?? 0);

        setPaymentAmountUSD(parseFloat(normalizeNumberPrecision(usdAmount)));
      }
    }
    setBalanceEnough(balanceEnough);
  }, [
    crossChainMode,
    balanceCheck,
    usdAmountMode,
    paymentAmountUSD,
    paymentAmount,
    selectedToken,
    paymentTokenBalance,
    selectedTokenPrice
  ]);

  useEffect(() => {
    if (usdAmountMode) {
      if (paymentAmountUSD) {
        setInputValue(formatAmountWithSuffix(normalizeNumberPrecision(paymentAmountUSD)));
      }
    } else {
      if (paymentAmount) {
        setInputValue(formatAmountWithSuffix(normalizeNumberPrecision(paymentAmount)));
      }
    }
  }, [usdAmountMode]);

  useEffect(() => {
    if (setPaymentEnabled) {
      setPaymentEnabled(
        Boolean(
          balanceEnough &&
            paymentAmount &&
            paymentAmount > 0 &&
            paymentAmountUSD &&
            paymentAmountUSD > 0
        )
      );
    }
  }, [balanceEnough, paymentAmount, paymentAmountUSD]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Allow empty input or any positive number (including decimals)
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
      const numericValue = value === '' ? undefined : parseFloat(value);

      if (usdAmountMode) {
        setPaymentAmountUSD(numericValue);
        if (value === '') {
          setPaymentAmount(undefined);
        }
      } else {
        setPaymentAmount(numericValue);
        if (value === '') {
          setPaymentAmountUSD(undefined);
        }
      }
    }
  };

  return (
    <Stack mt={1}>
      {selectedToken ? (
        <>
          {!crossChainMode && !payment?.token && (
            <TextField
              // don't auto focus if it's pending payment
              {...(!paymentAmount && { autoFocus: true, focused: true })}
              variant="standard"
              placeholder="0"
              value={inputValue}
              inputMode="decimal"
              error={
                Boolean(usdAmountMode ? paymentAmountUSD : paymentAmount) && balanceEnough === false
              }
              slotProps={{
                input: {
                  disableUnderline: true,
                  style: {
                    maxWidth: 250,
                    fontWeight: 'bold',
                    fontSize: 36,
                    padding: 0,
                    textAlign: 'center'
                  },
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton
                        size="small"
                        onClick={() => setUsdAmountMode(!usdAmountMode)}
                        sx={{ color: 'text.secondary' }}>
                        {usdAmountMode ? <FaDollarSign /> : <FaCoins />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
              onChange={handleInputChange}
              sx={{ minWidth: 'auto' }}
            />
          )}

          {!crossChainMode && !payment?.token && (
            <Stack mx="5px" direction="row" alignItems="center" spacing={0.5}>
              {!isBalanceFetched && paymentAmount && paymentAmountUSD ? (
                <Skeleton
                  title="fetching price"
                  variant="rectangular"
                  sx={{ borderRadius: 3, height: 35, width: 80 }}
                />
              ) : (
                <Typography
                  fontSize={16}
                  fontWeight="bold"
                  noWrap
                  onClick={() => setUsdAmountMode(!usdAmountMode)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 }
                  }}>
                  {usdAmountMode
                    ? `${formatAmountWithSuffix(
                        normalizeNumberPrecision(paymentAmount ?? 0)
                      )} ${selectedToken.id.toUpperCase()}`
                    : `$ ${formatAmountWithSuffix(
                        normalizeNumberPrecision(paymentAmountUSD ?? 0)
                      )} USD`}
                </Typography>
              )}

              {!payment?.token && balanceCheck && (
                <Button
                  onClick={async () => {
                    if (paymentTokenBalance?.balance && selectedTokenPrice) {
                      const maxAmount = parseFloat(
                        formatUnits(paymentTokenBalance.balance.value, selectedToken.decimals)
                      );
                      if (usdAmountMode) {
                        setPaymentAmountUSD(
                          parseFloat(normalizeNumberPrecision(maxAmount * selectedTokenPrice))
                        );

                        setInputValue(
                          formatAmountWithSuffix(
                            normalizeNumberPrecision(maxAmount * selectedTokenPrice)
                          )
                        );
                      } else {
                        setPaymentAmount(parseFloat(normalizeNumberPrecision(maxAmount)));
                        setInputValue(formatAmountWithSuffix(normalizeNumberPrecision(maxAmount)));
                      }
                    } else {
                      setPaymentAmount(undefined);
                      setInputValue('');
                    }
                  }}
                  sx={{
                    minWidth: 'auto',
                    borderRadius: 5,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    color: 'text.secondary'
                  }}>
                  max
                </Button>
              )}
            </Stack>
          )}

          {(crossChainMode || payment?.token) && (
            <Typography fontSize={30} fontWeight="bold" textAlign="center">
              {usdAmountMode
                ? `$ ${paymentAmountUSD}`
                : `${formatAmountWithSuffix(
                    normalizeNumberPrecision(paymentAmount ?? 0)
                  )} ${selectedToken.id.toUpperCase()}`}{' '}
              ≈{' '}
              {usdAmountMode
                ? `${formatAmountWithSuffix(
                    normalizeNumberPrecision(paymentAmount ?? 0)
                  )} ${selectedToken.id.toUpperCase()}`
                : `$ ${normalizeNumberPrecision(paymentAmountUSD ?? 0)}`}
            </Typography>
          )}

          {!crossChainMode &&
            Boolean(usdAmountMode ? paymentAmountUSD : paymentAmount) &&
            balanceEnough === false && (
              <Button
                variant="outlined"
                size="small"
                sx={{
                  color: red.A400,
                  borderColor: red.A400,
                  textTransform: 'none',
                  borderRadius: 5,
                  borderStyle: 'dashed',
                  fontSize: 12
                }}
                onClick={async () => {
                  setCrossChainMode?.(true);
                }}
                startIcon={<MdMultipleStop />}>
                {'Balance not enough -> Pay with other token'}
              </Button>
            )}
        </>
      ) : (
        <Skeleton
          title="loading token"
          variant="rounded"
          sx={{ borderRadius: 5, height: 80, width: 150 }}
        />
      )}
    </Stack>
  );
}
