import { useTokenPrices } from '../queries/prices';
import { useMintData } from '../hooks/useMintData';
import { PaymentType } from '../../types/PaymentType';
import { ERC20_CONTRACTS, Token } from '../../utils/erc20contracts';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { getNetworkDefaultBlockExplorerUrl } from '../../utils/networks';

export const usePaymentActivityDetails = (payment: PaymentType) => {
  const { data: tokenPrices } = useTokenPrices();
  const { mintData } = useMintData(payment);

  let token, formattedTokenAmount, formattedUsdAmount;

  if (payment.category === 'mint') {
    formattedTokenAmount = '1';
  } else if (payment.category === 'fc_storage') {
    formattedTokenAmount = formatAmountWithSuffix(payment.tokenAmount.toString());
  } else {
    token = ERC20_CONTRACTS.find(
      (t) => t.chainId === payment.chainId && t.id === payment.token
    ) as Token;

    const price = tokenPrices ? tokenPrices[token.id] : 0;

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

  return {
    token,
    formattedTokenAmount,
    formattedUsdAmount,
    defaultBlockExplorerUrl: getNetworkDefaultBlockExplorerUrl(payment.chainId),
    mintData
  };
};
