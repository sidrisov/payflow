import { glideConfig } from '../glide';
import { Hex } from 'viem';
import { useQuery } from '@tanstack/react-query';
import {
  CAIP19,
  Currency,
  estimatePaymentAmount,
  listPaymentOptions
} from '@paywithglide/glide-js';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: Unreachable code error
BigInt.prototype.toJSON = function (): string {
  return this.toString();
};

export type ListPaymentOptionsArgs = {
  chainId: number;
  account: Hex;
  abi: unknown;
  address: Hex;
  functionName: string;
  args?: unknown[];
  value?: bigint;
  paymentCurrencies?: (CAIP19 | Currency)[];
  paymentChainIds?: number[];
  commissionUSD?: number;
};

export type EstimatePaymentArgs = {
  chainId: number;
  account: Hex;
  paymentCurrency: CAIP19;
  abi: unknown;
  address: Hex;
  functionName: string;
  args?: unknown[];
  value?: bigint;
  commissionUSD?: number;
};

export const useGlideEstimatePayment = (enabled: boolean, args: EstimatePaymentArgs) => {
  return useQuery({
    enabled,
    queryKey: ['estimateGlidePayment', args],
    staleTime: Infinity,
    refetchInterval: 30_000,
    retry: false,
    queryFn: async () => {
      return await estimatePaymentAmount(glideConfig, args as any);
    }
  });
};

export const useGlidePaymentOptions = (enabled: boolean, args: ListPaymentOptionsArgs) => {
  return useQuery({
    enabled,
    queryKey: ['listPaymentOptions', args],
    staleTime: Infinity,
    refetchInterval: 30_000,
    retry: false,
    queryFn: async () => {
      return await listPaymentOptions(glideConfig, args as any);
    }
  });
};
