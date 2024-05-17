import { glideClient } from '../glide';
import { Address, Hex } from 'viem';
import { useQuery } from '@tanstack/react-query';

export type EIP155Address = `eip155:${string}`;

export type PaymentOption = {
  paymentCurrency: EIP155Address;
  paymentAmount: string;
  balance: string;
  balanceUSD: string;
  currencyName: string;
  currencySymbol: string;
  currencyLogoURL: string;
};

export type EVMTransaction = {
  chainId: EIP155Address;
  to: Hex;
  value: Hex;
  input: Hex;
};

export type ViemTransaction<ChainId extends number> = {
  chainId: ChainId;
  to: Address;
  data?: Hex;
  value?: bigint;
};

export const useGlideEstimatePayment = (
  enabled: boolean,
  paymentCurrency: string,
  transaction: EVMTransaction
) => {
  return useQuery({
    enabled: enabled,
    queryKey: ['estimateGlidePayment', { paymentCurrency, transaction }],
    staleTime: Infinity,
    refetchInterval: 15_000,
    queryFn: async () => {
      return await glideClient.estimatePaymentAmount({
        paymentCurrency,
        transaction
      });
    }
  });
};

export const useGlidePaymentOptions = (
  enabled: boolean,
  payerWalletAddress: Address,
  transaction: EVMTransaction
) => {
  return useQuery({
    enabled: enabled,
    queryKey: ['listPaymentOptions', { payerWalletAddress, transaction }],
    staleTime: Infinity,
    refetchInterval: 15_000,
    queryFn: async () => {
      return await glideClient.listPaymentOptions({
        payerWalletAddress,
        transaction
      });
    }
  });
};
