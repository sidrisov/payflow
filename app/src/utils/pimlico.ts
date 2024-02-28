import {
  createPimlicoBundlerClient,
  createPimlicoPaymasterClient
} from 'permissionless/clients/pimlico';
import { http } from 'viem';
import { arbitrum, base, baseSepolia, optimism, zkSync, zora } from 'viem/chains';

export const transport = (chainId: number) => {
  return http(
    `https://api.pimlico.io/v1/${pimlicoRpcNetworkName(chainId)}/rpc?apikey=${
      import.meta.env.VITE_PIMLICO_API_KEY
    }`
  );
};

export const bundlerClient = (chainId: number) => {
  return createPimlicoBundlerClient({
    transport: http(
      `https://api.pimlico.io/v1/${pimlicoRpcNetworkName(chainId)}/rpc?apikey=${
        import.meta.env.VITE_PIMLICO_API_KEY
      }`
    )
  });
};

export const paymasterClient = (chainId: number) => {
  return createPimlicoPaymasterClient({
    transport: http(
      `https://api.pimlico.io/v2/${pimlicoRpcNetworkName(chainId)}/rpc?apikey=${
        import.meta.env.VITE_PIMLICO_API_KEY
      }`
    )
  });
};

const pimlicoRpcNetworkName = (chainId: number) => {
  let network = '';
  switch (chainId) {
    case base.id:
      network = 'base';
      break;
    case baseSepolia.id:
      network = 'base-sepolia';
      break;
    case optimism.id:
      network = 'optimism';
      break;
    case zkSync.id:
      network = 'zksync-era';
      break;
    case arbitrum.id:
      network = 'arbitrum';
      break;
    case zora.id:
      network = 'zora';
      break;
  }
  return network;
};
