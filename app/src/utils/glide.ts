import { createGlideConfig, PaymentOption } from '@paywithglide/glide-js';
import { base, optimism, degen, arbitrum, mode, zora } from 'wagmi/chains';
import { Token } from './erc20contracts';

export const glideConfig = createGlideConfig({
  projectId: import.meta.env.VITE_GLIDE_API_KEY,
  chains: [base, optimism, zora, degen, arbitrum, mode]
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
        paymentToken.tokenAddress
          ? `erc20:${paymentToken.tokenAddress}`
          : paymentToken.chainId === degen.id
          ? 'slip44:33436'
          : 'slip44:60'
      }`.toLowerCase()
  );
};
