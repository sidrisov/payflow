import { useQuery } from '@tanstack/react-query';
import { Address, zeroAddress } from 'viem';

import { Abi, ContractFunctionArgs, ContractFunctionName } from 'viem';
import { hypersubAbi } from '../abi/hypersubAbi';
import { HypersubData } from './useHypersubData';

type HypersubPaymentTx = {
  chainId: number;
  address: Address;
  abi: Abi;
  functionName: ContractFunctionName;
  args?: ContractFunctionArgs;
  value: bigint;
};

async function prepareHypersubPaymentTx(
  hypersub: HypersubData,
  recipient: Address,
  referrer: Address,
  periods: number
): Promise<HypersubPaymentTx> {
  console.log('tokenAddress', hypersub.contractAddress);
  console.log('tokenAmount', periods);

  const price = BigInt(periods) * hypersub.state.tier1.params.pricePerPeriod;

  const mintParams: [number, Address, Address, bigint, bigint] = [
    1,
    recipient,
    referrer,
    BigInt(0),
    price
  ];

  return {
    chainId: hypersub.chainId,
    address: hypersub.contractAddress,
    abi: hypersubAbi as Abi,
    functionName: 'mintAdvanced',
    args: [mintParams],
    value: hypersub.state.currency === zeroAddress ? BigInt(price) : 0n
  };
}

export function useHypersubPaymentTx(
  hypersub: HypersubData,
  recipient: Address,
  referrer: Address,
  periods: number
) {
  return useQuery<HypersubPaymentTx, Error>({
    enabled: Boolean(hypersub && recipient && periods),
    staleTime: Infinity,
    refetchInterval: 30_000,
    retry: false,
    queryKey: ['hypersubPaymentTx', hypersub.contractAddress, recipient, referrer, periods],
    queryFn: async () => {
      return prepareHypersubPaymentTx(hypersub, recipient, referrer, periods);
    }
  });
}
