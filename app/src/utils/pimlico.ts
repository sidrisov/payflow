import { http } from 'viem';
import { entryPoint06Address } from 'viem/account-abstraction';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { arbitrum, base, baseSepolia, degen, mode, optimism, zksync, zora } from 'viem/chains';

export const PIMLICO_SPONSORED_ENABLED = import.meta.env.VITE_PIMLICO_SPONSORED_ENABLED === 'true';

export const transport = (chainId: number) => {
  return http(
    `https://api.pimlico.io/v2/${pimlicoRpcNetworkName(chainId)}/rpc?apikey=${
      import.meta.env.VITE_PIMLICO_API_KEY
    }`
  );
};

export const pimlicoClient = (chainId: number) => {
  return createPimlicoClient({
    transport: transport(chainId),
    entryPoint: {
      address: entryPoint06Address,
      version: '0.6'
    }
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
    case zksync.id:
      network = 'zksync-era';
      break;
    case arbitrum.id:
      network = 'arbitrum';
      break;
    case zora.id:
      network = 'zora';
      break;
    case degen.id:
      network = 'degen';
      break;
    case mode.id:
      network = 'mode';
      break;
  }
  return network;
};

// mainnet sponsorship policies
const BASE_POLICIES = JSON.parse(import.meta.env.VITE_PIMLICO_SPONSORED_POLICY_BASE) as string[];
// testnet sponsorship policies
const BASE_SEPOLIA_POLICIES = JSON.parse(
  import.meta.env.VITE_PIMLICO_SPONSORED_POLICY_BASE_SEPOLIA
) as string[];

export const paymasterSponsorshipPolicyIds = (chainId: number) => {
  switch (chainId) {
    case base.id:
    case arbitrum.id:
    case optimism.id:
    case degen.id:
    case mode.id:
      return BASE_POLICIES;
    case baseSepolia.id:
      return BASE_SEPOLIA_POLICIES;
    default:
      return [];
  }
};
