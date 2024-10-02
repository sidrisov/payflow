import { useQuery } from '@tanstack/react-query';
import { base } from 'viem/chains';
import { Abi, Address, ContractFunctionArgs, ContractFunctionName, parseUnits } from 'viem';
import { FAN_TOKEN_BOND_CURVE_CONTRACT_ADDR } from '../contracts';
import { readContract } from 'wagmi/actions';
import { wagmiConfig } from '../wagmiConfig';
import { buyFanTokenAbi } from '../abi/buyFanTokenAbi';

type FanTokenPaymentTx = {
  chainId: number;
  address: Address;
  abi: Abi;
  functionName: ContractFunctionName;
  args?: ContractFunctionArgs;
  value: bigint;
};

async function fetchFanTokenPaymentTx(
  tokenAddress: Address,
  tokenAmount: number,
  recipient: Address
): Promise<FanTokenPaymentTx> {
  console.log('tokenAddress', tokenAddress);
  console.log('tokenAmount', tokenAmount);

  const subjectTokenAmount = parseUnits(tokenAmount.toString(), 18);
  const minSubjectTokenAmount = parseUnits((tokenAmount * 0.95).toString(), 18);

  const [moxieAmount] = (await readContract(wagmiConfig, {
    chainId: base.id,
    address: FAN_TOKEN_BOND_CURVE_CONTRACT_ADDR,
    abi: buyFanTokenAbi,
    functionName: 'calculateTokensForBuy',
    args: [tokenAddress, subjectTokenAmount]
  })) as bigint[];

  console.log('moxieAmount', moxieAmount);

  if (!moxieAmount) {
    throw new Error('Failed to calculate token moxie amount cost');
  }

  return {
    chainId: base.id,
    address: FAN_TOKEN_BOND_CURVE_CONTRACT_ADDR,
    abi: buyFanTokenAbi as Abi,
    functionName: 'buySharesFor',
    args: [
      tokenAddress,
      moxieAmount,
      recipient,
      minSubjectTokenAmount
    ],
    value: 0n
  };
}

export function useFanTokenPaymentTx(tokenAddress: Address, tokenAmount: number, recipient: Address) {
  return useQuery<FanTokenPaymentTx, Error>({
    enabled: Boolean(tokenAddress && tokenAmount && recipient),
    staleTime: Infinity,
    refetchInterval: 30_000,
    retry: false,
    queryKey: ['fanTokenPaymentTx', tokenAddress, tokenAmount, recipient],
    queryFn: async () => {
      return fetchFanTokenPaymentTx(tokenAddress, tokenAmount, recipient);
    }
  });
}
