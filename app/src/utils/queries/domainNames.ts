import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BaseNameReponseType } from '../../types/BaseNameType';
import { getPublicClient } from 'wagmi/actions';
import { privyWagmiConfig } from '../wagmiConfig';
import { degen } from 'viem/chains';
import { Address } from 'viem';

export const useBaseName = (address: Address | undefined, enabled: boolean) => {
  return useQuery({
    enabled: enabled && Boolean(address),
    queryKey: ['baseName', { address }],
    staleTime: Infinity,
    queryFn: () =>
      axios.get(`https://resolver-api.basename.app/v1/addresses/${address}`).then((res) => {
        console.log('hello', res);
        const baseName = res.data as BaseNameReponseType;

        return baseName.name;
      })
  });
};

export const useDegenName = (address: Address | undefined, enabled: boolean) => {
  const publicClient = getPublicClient(privyWagmiConfig, { chainId: degen.id });

  return useQuery({
    enabled: enabled && publicClient && Boolean(address),
    queryKey: ['degenName', { address }],
    staleTime: Infinity,
    queryFn: async () => {
      if (publicClient && address) {
        const degenName = publicClient.readContract({
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
        return (await degenName).concat('.degen');
      }
    }
  });
};
