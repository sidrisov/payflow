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
