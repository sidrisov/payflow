import { getChains } from '@wagmi/core';
import { base, optimism, zora, baseSepolia, degen, arbitrum, mode } from 'viem/chains';

export const SUPPORTED_CHAINS = [base, optimism, degen, arbitrum, mode, zora, baseSepolia];

export default function getNetworkImageSrc(chainId: number): string {
  let fileName;

  switch (chainId) {
    case base.id:
      fileName = 'base';
      break;
    case optimism.id:
      fileName = 'optimism';
      break;
    case zora.id:
      fileName = 'zora';
      break;
    case degen.id:
      fileName = 'degen';
      break;
    case arbitrum.id:
      fileName = 'arbitrum';
      break;
    case mode.id:
      fileName = 'mode';
      break;
  }

  if (!fileName) {
    throw new Error(`Chain ${chainId} not supported!`);
  }

  return `/assets/chains/${fileName}.png`;
}

export function getNetworkDisplayName(chainId: number): string {
  const displayName = SUPPORTED_CHAINS.find((c) => c.id === chainId)?.name;

  if (!displayName) {
    throw new Error(`Chain ${chainId} not supported!`);
  }

  return displayName;
}

export function getReceiptUrl(chainId: number, hash: string): string {
  let baseUrl;

  switch (chainId) {
    case base.id:
      baseUrl = base.blockExplorers.default.url;
      break;
    case optimism.id:
      baseUrl = optimism.blockExplorers.default.url;
      break;
    case zora.id:
      baseUrl = zora.blockExplorers.default.url;
      break;
    case degen.id:
      baseUrl = degen.blockExplorers.default.url;
      break;
    case arbitrum.id:
      baseUrl = arbitrum.blockExplorers.default.url;
      break;
    case mode.id:
      baseUrl = mode.blockExplorers.default.url;
      break;
  }

  if (!baseUrl) {
    throw new Error(`Chain ${chainId} not supported!`);
  }

  return `${baseUrl}/tx/${hash}`;
}
