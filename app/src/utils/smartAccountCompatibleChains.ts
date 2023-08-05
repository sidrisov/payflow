import {
  zkSyncTestnet,
  baseGoerli,
  optimismGoerli,
  zoraTestnet,
  optimism,
  base
} from 'wagmi/chains';

export function smartAccountCompatibleChains() {
  return [
    optimismGoerli.name,
    baseGoerli.name,
    zoraTestnet.name,
    zkSyncTestnet.name,
    optimism.name,
    base.name
  ] as string[];
}
