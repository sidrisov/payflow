import { useQuery } from '@tanstack/react-query';
import { optimism } from 'viem/chains';
import { Abi, Address, ContractFunctionArgs, ContractFunctionName } from 'viem';
import { rentStorageAbi } from '../abi/rentFcStorageAbi';
import { OP_FARCASTER_STORAGE_CONTRACT_ADDR } from '../contracts';
import { readContract } from 'wagmi/actions';
import { wagmiConfig } from '../wagmiConfig';

type StoragePaymentTx = {
  chainId: number;
  address: Address;
  abi: Abi;
  functionName: ContractFunctionName;
  args?: ContractFunctionArgs;
  value: bigint;
};

async function fetchStoragePaymentTx(
  numberOfUnits: number,
  receiverFid: number
): Promise<StoragePaymentTx> {
  const rentUnitPrice = await readContract(wagmiConfig, {
    chainId: optimism.id,
    address: OP_FARCASTER_STORAGE_CONTRACT_ADDR,
    abi: rentStorageAbi,
    functionName: 'price',
    args: [BigInt(numberOfUnits)]
  });

  if (!rentUnitPrice) {
    throw new Error('Failed to fetch rent unit price');
  }

  return {
    chainId: optimism.id,
    address: OP_FARCASTER_STORAGE_CONTRACT_ADDR,
    abi: rentStorageAbi,
    functionName: 'rent',
    args: [BigInt(receiverFid), BigInt(numberOfUnits)],
    value: rentUnitPrice
  };
}

export function useStoragePaymentTx(numberOfUnits: number, receiverFid?: number) {
  return useQuery<StoragePaymentTx, Error>({
    enabled: Boolean(numberOfUnits) && Boolean(receiverFid),
    staleTime: Infinity,
    refetchInterval: 30_000,
    retry: false,
    queryKey: ['storagePaymentTx', numberOfUnits, receiverFid],
    queryFn: async () => {
      if (!receiverFid) throw new Error('Fid not found');
      return fetchStoragePaymentTx(numberOfUnits, receiverFid);
    }
  });
}
