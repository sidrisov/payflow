import {
  http} from 'viem';
import { type Chain } from 'viem';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { config } from 'dotenv';
import {
  entryPoint06Address,
  entryPoint07Address
} from 'viem/account-abstraction';
import {
  arbitrum,
  base,
  baseSepolia,
  degen,
  mode,
  optimism,
  worldchain,
  zksync,
  zora
} from 'viem/chains';

// Load environment variables at the start of the file
config({ path: '.env.local' }); // Add .env.local as primary
config(); // Load .env as fallback

// Validate required environment variables
if (!process.env.PIMLICO_API_KEY) {
  throw new Error('PIMLICO_API_KEY is not set in environment variables');
}

export const PIMLICO_SPONSORED_ENABLED =
  process.env.PIMLICO_SPONSORED_ENABLED === 'true';

export const transport = (chainId: number) => {
  const apiKey = process.env.PIMLICO_API_KEY;
  if (!apiKey) {
    throw new Error('PIMLICO_API_KEY is not set');
  }

  return http(
    `https://api.pimlico.io/v2/${pimlicoRpcNetworkName(chainId)}/rpc?apikey=${apiKey}`
  );
};

export const pimlicoClient = (
  chainId: number,
  version: '0.6' | '0.7' = '0.6'
) => {
  const chain = [
    base,
    baseSepolia,
    optimism,
    zksync,
    arbitrum,
    zora,
    degen,
    mode,
    worldchain
  ].find((c) => c.id === chainId);

  if (!chain) throw new Error(`Chain with id ${chainId} not found`);

  return createPimlicoClient({
    transport: transport(chainId),
    entryPoint: {
      address: version === '0.6' ? entryPoint06Address : entryPoint07Address,
      version
    },
    chain
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
    case worldchain.id:
      network = 'worldchain';
      break;
  }
  return network;
};

const parsePolicies = (envValue: string | undefined) => {
  if (!envValue) return [];
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(envValue);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    // Fallback to simple comma split if not JSON
    return envValue.split(',').map((p) => p.trim());
  }
};

const MAINNET_POLICIES = parsePolicies(
  process.env.PIMLICO_SPONSORED_POLICY_MAINNET
);
const TESTNET_POLICIES = parsePolicies(
  process.env.PIMLICO_SPONSORED_POLICY_SEPOLIA
);

export const pimlicoSponsorshipPolicyIds = (chainId: number) => {
  switch (chainId) {
    case base.id:
      return MAINNET_POLICIES.slice(0, 1);
    case arbitrum.id:
    case optimism.id:
    case degen.id:
    case mode.id:
    case worldchain.id:
      return MAINNET_POLICIES.slice(1, 2);
    case baseSepolia.id:
      return TESTNET_POLICIES;
    default:
      return [];
  }
};
