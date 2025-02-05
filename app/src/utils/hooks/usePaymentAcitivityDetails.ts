import { useTokenPrices } from '../queries/prices';
import { useMintData } from '../hooks/useMintData';
import { PaymentType } from '@payflow/common';
import { tokens as SUPPORTED_TOKENS, Token } from '@payflow/common';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { getNetworkDefaultBlockExplorerUrl } from '../../utils/networks';
import { useHypersubData } from './useHypersub';

export const usePaymentActivityDetails = (payment: PaymentType) => {
  const { data: tokenPrices } = useTokenPrices();
  const { mintData } = useMintData(payment);
  const { hypersubData } = useHypersubData(payment);

  let token, formattedTokenAmount, formattedUsdAmount;

  if (payment.category === 'mint') {
    formattedTokenAmount = '1';
  } else if (payment.category === 'fan') {
    formattedTokenAmount = formatAmountWithSuffix(payment.tokenAmount.toString());
  } else if (payment.category === 'fc_storage') {
    formattedTokenAmount = formatAmountWithSuffix(payment.tokenAmount.toString());
  } else if (payment.category === 'hypersub') {
    formattedTokenAmount = formatAmountWithSuffix(payment.tokenAmount.toString());
  } else {
    token = SUPPORTED_TOKENS.find(
      (t) => t.chainId === payment.chainId && t.id === payment.token
    ) as Token;

    if (token) {
      const price = tokenPrices ? tokenPrices[token.underlyingToken?.id || token.id] : 0;

      const tokenAmount =
        payment.tokenAmount || (payment.usdAmount ? (payment.usdAmount / price).toString() : '0');
      const usdAmount =
        payment.usdAmount ||
        (payment.tokenAmount ? parseFloat(payment.tokenAmount.toString()) * price : 0);
      formattedTokenAmount = formatAmountWithSuffix(
        normalizeNumberPrecision(parseFloat(tokenAmount.toString()))
      );
      formattedUsdAmount = formatAmountWithSuffix(normalizeNumberPrecision(usdAmount));
    }
  }

  return {
    token,
    formattedTokenAmount,
    formattedUsdAmount,
    defaultBlockExplorerUrl: getNetworkDefaultBlockExplorerUrl(payment.chainId),
    mintData,
    hypersubData
  };
};
