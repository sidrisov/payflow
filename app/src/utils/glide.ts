import { createGlideConfig, PaymentOption } from '@paywithglide/glide-js';
import { base, optimism, arbitrum, polygon } from 'wagmi/chains';
import { Token } from '@payflow/common';
import { PaymentType } from '@payflow/common';

export const glideConfig = createGlideConfig({
  projectId: import.meta.env.VITE_GLIDE_API_KEY,
  chains: [base, optimism, arbitrum, polygon]
});

export const getPaymentOption = (
  paymentOptions: PaymentOption[] | undefined,
  paymentToken: Token | undefined
) => {
  if (!paymentOptions || !paymentToken) return null;
  return paymentOptions.find(
    (option) =>
      option.paymentCurrency.toLowerCase() ===
      `eip155:${paymentToken.chainId}/${
        paymentToken.tokenAddress ? `erc20:${paymentToken.tokenAddress}` : 'slip44:60'
      }`.toLowerCase()
  );
};

export const getCommissionUSD = (payment?: PaymentType) => {
  switch (payment?.category) {
    case 'fc_storage':
      return payment?.tokenAmount ? 0.25 + (payment.tokenAmount - 1) * 0.05 : 0.25;
    default:
      return 0.05;
  }
};
