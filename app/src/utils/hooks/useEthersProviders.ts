import React from 'react';
import { type PublicClient, usePublicClient } from 'wagmi';
import { providers } from 'ethers';
import { type HttpTransport } from 'viem';

export function publicClientToProvider(publicClient: PublicClient) {
  const { chain, transport } = publicClient;

  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  };
  if (transport.type === 'fallback')
    return new providers.FallbackProvider(
      (transport.transports as ReturnType<HttpTransport>[]).map(
        ({ value }) => new providers.JsonRpcProvider(value?.url, network)
      )
    );
  return new providers.JsonRpcProvider(transport.url, network);
}

/** Hook to convert a viem Public Client to an ethers.js Provider. */
export function useEthersProviders({ chainIds }: { chainIds: number[] }) {
  const publicClients = chainIds.map((chainId) => usePublicClient({ chainId }));

  return React.useMemo(
    () => publicClients.map((publicClient) => publicClientToProvider(publicClient)),
    [publicClients]
  );
}
