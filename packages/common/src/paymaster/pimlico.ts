import { http, type Transport } from 'viem';
import { createPimlicoClient, PimlicoClient } from 'permissionless/clients/pimlico';
import { entryPoint06Address, entryPoint07Address } from 'viem/account-abstraction';
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

export type PimlicoPaymasterConfig = {
  apiKey: string;
  sponsoredEnabled?: boolean;
  mainnetPolicies?: string[];
  testnetPolicies?: string[];
};

let pimlicoConfig: PimlicoPaymasterConfig | null = null;

export const initialize = (config: PimlicoPaymasterConfig) => {
  if (!config.apiKey) {
    throw new Error('Pimlico API key is required');
  }
  pimlicoConfig = config;
};

const getConfig = () => {
  if (!pimlicoConfig) {
    throw new Error('Pimlico not initialized. Call initialize first');
  }
  return pimlicoConfig;
};

const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case base.id:
      return 'base';
    case baseSepolia.id:
      return 'base-sepolia';
    case optimism.id:
      return 'optimism';
    case zksync.id:
      return 'zksync-era';
    case arbitrum.id:
      return 'arbitrum';
    case zora.id:
      return 'zora';
    case degen.id:
      return 'degen';
    case mode.id:
      return 'mode';
    case worldchain.id:
      return 'worldchain';
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
};

const getSupportedChain = (chainId: number) => {
  const chain = [base, baseSepolia, optimism, zksync, arbitrum, zora, degen, mode, worldchain].find(
    (c) => c.id === chainId
  );

  if (!chain) throw new Error(`Chain with id ${chainId} not found`);
  return chain;
};

export const transport = (chainId: number): Transport => {
  const config = getConfig();
  const networkName = getNetworkName(chainId);

  return http(`https://api.pimlico.io/v2/${networkName}/rpc?apikey=${config.apiKey}`);
};

export const client = (chainId: number, version: '0.6' | '0.7' = '0.6'): PimlicoClient => {
  const chain = getSupportedChain(chainId);

  return createPimlicoClient({
    transport: transport(chainId),
    entryPoint: {
      address: version === '0.6' ? entryPoint06Address : entryPoint07Address,
      version
    },
    chain
  });
};

export const sponsorshipPolicyIds = (chainId: number): string[] => {
  const config = getConfig();
  const { mainnetPolicies = [], testnetPolicies = [] } = config;

  switch (chainId) {
    case base.id:
      return mainnetPolicies.slice(0, 1);
    case arbitrum.id:
    case optimism.id:
    case degen.id:
    case mode.id:
    case worldchain.id:
      return mainnetPolicies.slice(1, 2);
    case baseSepolia.id:
      return testnetPolicies;
    default:
      return [];
  }
};

export const isSponsoredEnabled = () => {
  const config = getConfig();
  return config.sponsoredEnabled ?? false;
};
