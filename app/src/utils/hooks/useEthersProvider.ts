import { FallbackProvider, JsonRpcProvider } from 'ethers';
import { useMemo } from 'react';
import type { Chain, Client, Transport } from 'viem';
import { type Config, useClient } from 'wagmi';
import { getClient } from 'wagmi/actions';
import { privyWagmiConfig } from '../wagmiConfig';

export function clientToProvider(client: Client<Transport, Chain>) {
  const { chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  };
  if (transport.type === 'fallback') {
    const providers = (transport.transports as ReturnType<Transport>[]).map(
      ({ value }) => new JsonRpcProvider(value?.url, network)
    );
    if (providers.length === 1) return providers[0];
    return new FallbackProvider(providers);
  }
  return new JsonRpcProvider(transport.url, network);
}

/** Hook to convert a viem Client to an ethers.js Provider. */
export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
  const client = useClient<Config>({ chainId });
  return useMemo(() => clientToProvider(client as Client<Transport, Chain>), [client]);
}

/** Action to convert a viem Public Client to an ethers.js Provider. */
export function getEthersProvider({ chainId }: { chainId?: number } = {}) {
  const client = getClient(privyWagmiConfig, { chainId });
  return clientToProvider(client as Client<Transport, Chain>);
}
