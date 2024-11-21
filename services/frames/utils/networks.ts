import {
  base,
  optimism,
  zora,
  baseSepolia,
  degen,
  arbitrum,
  mode,
  sepolia,
  zksync,
  mainnet,
  ham
} from 'viem/chains';

export const SUPPORTED_CHAINS = [base, optimism, degen, arbitrum, mode, zora, ham];

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
    case ham.id:
      fileName = 'ham';
      break;
  }

  if (!fileName) {
    throw new Error(`Chain ${chainId} not supported!`);
  }

  return `/assets/chains/${fileName}.png`;
}

export function getNetworkShortName(chainId: number): string {
  let shortName;

  switch (chainId) {
    case mainnet.id:
      shortName = 'ethereum';
      break;
    case sepolia.id:
      shortName = 'sepolia';
      break;
    case base.id:
      shortName = 'base';
      break;
    case baseSepolia.id:
      shortName = 'base';
      break;
    case optimism.id:
      shortName = 'optimism';
      break;
    case zksync.id:
      shortName = 'zksync-era';
      break;
    case arbitrum.id:
      shortName = 'arbitrum';
      break;
    case zora.id:
      shortName = 'zora';
      break;
    case mode.id:
      shortName = 'mode';
      break;
    case degen.id:
      shortName = 'degen';
      break;
    case ham.id:
      shortName = 'ham';
      break;
  }

  if (!shortName) {
    throw new Error(`Chain ${chainId} not supported!`);
  }

  return shortName;
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
    case ham.id:
      baseUrl = ham.blockExplorers.default.url;
      break;
  }

  if (!baseUrl) {
    throw new Error(`Chain ${chainId} not supported!`);
  }

  return `${baseUrl}/tx/${hash}`;
}
