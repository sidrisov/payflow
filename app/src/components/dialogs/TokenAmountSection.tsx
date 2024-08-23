import {
  Typography,
  Stack,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  styled,
  useMediaQuery
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
import { MdMultipleStop } from 'react-icons/md';

const TokenAmountTextField = styled(TextField)(() => ({
  '& .MuiInputBase-input::placeholder': {
    paddingLeft: '15px'
  }
}));

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
  selectedWallet: FlowWalletType;
  selectedToken?: Token;
  paymentAmount?: number;
  setPaymentAmount: React.Dispatch<React.SetStateAction<number | undefined>>;
  paymentAmountUSD?: number;
  setPaymentAmountUSD: React.Dispatch<React.SetStateAction<number | undefined>>;
  crossChainPaymentAmount?: number;
  setCrossChainPaymentAmount?: React.Dispatch<React.SetStateAction<number | undefined>>;
  balanceCheck?: boolean;
}) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const { chain } = useAccount();

  const { data: tokenPrices } = useTokenPrices();

  const [balanceEnough, setBalanceEnough] = useState<boolean>();

  const [selectedTokenPrice, setSelectedTokenPrice] = useState<number>();

  const [usdAmountMode, setUsdAmountMode] = useState<boolean>(Boolean(payment?.usdAmount));

  const crossChainModeSupported = Boolean(payment?.token);

  const { data: balance } = useBalance({
    address: selectedWallet?.address,
    chainId: chain?.id,
    token: selectedToken?.tokenAddress,
    query: {
      enabled: balanceCheck && Boolean(selectedWallet && selectedToken),
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
    if (selectedToken && selectedTokenPrice && (!balanceCheck || balance)) {
      if (usdAmountMode === true && paymentAmountUSD !== undefined) {
        const amount = parseUnits(
          (paymentAmountUSD / selectedTokenPrice).toString(),
          selectedToken.decimals
        );
        balanceEnough = !balanceCheck || crossChainMode ? true : amount <= (balance?.value ?? 0);
        setPaymentAmount(parseFloat(formatUnits(amount, selectedToken.decimals)));
      }
      if (usdAmountMode === false && paymentAmount !== undefined) {
        const usdAmount = paymentAmount * selectedTokenPrice;
        balanceEnough =
          !balanceCheck || crossChainMode
            ? true
            : parseUnits(paymentAmount.toString(), selectedToken.decimals) <= (balance?.value ?? 0);
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
    chain?.id,
    selectedToken,
    balance,
    selectedTokenPrice
  ]);

  useMemo(() => {
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

  return (
    <Stack height="100%" mt={1} alignItems="center">
      {!payment?.token ? (
        <TokenAmountTextField
          // don't auto focus if it's pending payment
          {...(!paymentAmount && { autoFocus: true, focused: true })}
          variant="standard"
          placeholder="0"
          margin="dense"
          type="number"
          value={usdAmountMode ? paymentAmountUSD : paymentAmount}
          error={
            Boolean(usdAmountMode ? paymentAmountUSD : paymentAmount) && balanceEnough === false
          }
          inputProps={{
            style: {
              maxWidth: 100,
              fontWeight: 'bold',
              fontSize: 30,
              textAlign: 'center'
            }
          }}
          InputProps={{
            ...(usdAmountMode
              ? {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography fontSize={24} fontWeight="bold">
                        $
                      </Typography>
                    </InputAdornment>
                  )
                }
              : {
                  endAdornment: (
                    <InputAdornment position="start">
                      <Typography ml={0.5} fontSize={24} fontWeight="bold">
                        {selectedToken?.id.toUpperCase()}
                      </Typography>
                    </InputAdornment>
                  )
                }),
            disableUnderline: true
          }}
          onChange={async (event) => {
            if (event.target.value) {
              const amount = parseFloat(event.target.value);
              if (!isNaN(amount) && amount >= 0) {
                if (usdAmountMode) {
                  setPaymentAmountUSD(amount);
                } else {
                  setPaymentAmount(amount);
                }
              }
            } else {
              setPaymentAmountUSD(undefined);
              setPaymentAmount(undefined);
            }
          }}
          sx={{ minWidth: 'auto' }}
        />
      ) : (
        !crossChainMode && (
          <Typography fontSize={30} fontWeight="bold" textAlign="center">
            {usdAmountMode
              ? `$ ${paymentAmountUSD}`
              : `${paymentAmount} ${selectedToken?.id.toUpperCase()}`}
          </Typography>
        )
      )}

      {crossChainMode && (
        <Typography fontSize={18} fontWeight="bold" textAlign="center">
          for{' '}
          <u>
            {usdAmountMode
              ? `$ ${paymentAmountUSD}`
              : `${paymentAmount} ${selectedToken?.id.toUpperCase()}`}{' '}
            ≈{' '}
            {usdAmountMode
              ? `${normalizeNumberPrecision(paymentAmount ?? 0)} ${selectedToken?.id.toUpperCase()}`
              : `$ ${normalizeNumberPrecision(paymentAmountUSD ?? 0)}`}
          </u>
        </Typography>
      )}

      {!crossChainMode &&
        Boolean(usdAmountMode ? paymentAmountUSD : paymentAmount) &&
        balanceEnough === false && (
          <>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <PriorityHigh fontSize="small" sx={{ color: red.A400 }} />
              <Typography fontSize={14} fontWeight="bold" color={red.A400}>
                balance not enough
              </Typography>
            </Stack>
            {crossChainModeSupported &&
              !crossChainMode &&
              paymentAmountUSD &&
              paymentAmountUSD <= 10 && (
                <Button
                  variant="outlined"
                  color="inherit"
                  sx={{
                    mt: 1,
                    textTransform: 'none',
                    borderRadius: 5,
                    border: 2,
                    borderColor: 'divider',
                    borderStyle: 'dotted'
                  }}
                  onClick={async () => {
                    setCrossChainMode?.(true);
                  }}
                  startIcon={<MdMultipleStop />}>
                  Press to pay with different token
                </Button>
              )}
          </>
        )}

      {!crossChainMode && balanceEnough && (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {!payment?.token && (
            <IconButton
              size="small"
              sx={{ color: grey[prefersDarkMode ? 400 : 700] }}
              onClick={async () => {
                setUsdAmountMode(!usdAmountMode);
              }}>
              <SwapVert fontSize="small" />
            </IconButton>
          )}
          <Typography fontSize={20} fontWeight="bold">
            {usdAmountMode
              ? `${normalizeNumberPrecision(paymentAmount ?? 0)} ${selectedToken?.id.toUpperCase()}`
              : `$ ${normalizeNumberPrecision(paymentAmountUSD ?? 0)}`}
          </Typography>

          {!payment?.token && selectedToken && balanceCheck && (
            <Button
              onClick={async () => {
                if (balance && selectedTokenPrice) {
                  const maxAmount = parseFloat(formatUnits(balance.value, selectedToken.decimals));
                  if (usdAmountMode) {
                    setPaymentAmountUSD(
                      parseFloat(normalizeNumberPrecision(maxAmount * selectedTokenPrice))
                    );
                  } else {
                    setPaymentAmount(parseFloat(normalizeNumberPrecision(maxAmount)));
                  }
                } else {
                  setPaymentAmount(undefined);
                }
              }}
              sx={{
                minWidth: 'auto',
                borderRadius: 5,
                fontWeight: 'bold',
                textTransform: 'none',
                color: grey[prefersDarkMode ? 400 : 700]
              }}>
              MAX
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}
