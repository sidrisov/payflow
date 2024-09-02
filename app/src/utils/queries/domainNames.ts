import { useQuery } from '@tanstack/react-query';
import { getPublicClient } from 'wagmi/actions';
import { wagmiConfig } from '../wagmiConfig';
import { degen } from 'viem/chains';
import { Address } from 'viem';

export const useDegenName = (address: Address | undefined, enabled: boolean) => {
  const publicClient = getPublicClient(wagmiConfig, { chainId: degen.id });

  return useQuery({
    enabled: enabled && publicClient && Boolean(address),
    queryKey: ['degenName', { address }],
    staleTime: Infinity,
    queryFn: async () => {
      if (publicClient && address) {
        const degenName = await publicClient.readContract({
          address: '0x4087fb91A1fBdef05761C02714335D232a2Bf3a1',
          abi: [
            {
              inputs: [{ name: '', type: 'address' }],
              name: 'defaultNames',
              outputs: [{ name: '', type: 'string' }],
              stateMutability: 'view',
              type: 'function'
            }
          ],
          functionName: 'defaultNames',
          args: [address as Address]
        });
        if (degenName && degenName.length > 0) {
          return degenName.concat('.degen');
        }
      }
    }
  });
};
