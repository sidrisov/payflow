import { glideConfig } from '../glide';
import { Hex } from 'viem';
import { useQuery } from '@tanstack/react-query';
import {
  CAIP19,
  Currency,
  estimatePaymentAmount,
  listPaymentOptions,
  ResponseNotOkError
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
  approval?: {
    token: Hex;
    amount: bigint;
  };
  commissionUSD?: number;
};

export const useGlideEstimatePayment = (enabled: boolean, args: EstimatePaymentArgs) => {
  return useQuery({
    enabled,
    queryKey: ['estimateGlidePayment', args],
    staleTime: Infinity,
    refetchInterval: 120_000,
    retry: false,
    queryFn: async () => {
      try {
        return await estimatePaymentAmount(glideConfig, args as any);
      } catch (error: any) {
        if (error instanceof ResponseNotOkError) {
          console.error('Error in useGlideEstimatePayment', error);
          const errorMessage =
            'The contract or the function you are trying to interact with is not supported';
          throw new Error(errorMessage);
        }
        throw error;
      }
    }
  });
};

export const useGlidePaymentOptions = (enabled: boolean, args: ListPaymentOptionsArgs) => {
  return useQuery({
    enabled,
    queryKey: ['listPaymentOptions', args],
    staleTime: Infinity,
    refetchInterval: 120_000,
    retry: false,
    queryFn: async () => {
      try {
        return await listPaymentOptions(glideConfig, args as any);
      } catch (error: any) {
        if (error instanceof ResponseNotOkError) {
          console.error('Error in useGlidePaymentOptions', error);
          const errorMessage =
            'The contract or the function you are trying to interact with is not supported';
          throw new Error(errorMessage);
        }
        throw error;
      }
    }
  });
};
