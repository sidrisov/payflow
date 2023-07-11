import { zkSyncTestnet } from 'wagmi/chains';

export function smartAccountCompatibleChains() {
  return [zkSyncTestnet.name] as string[];
}
