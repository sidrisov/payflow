import {
  zkSyncTestnet,
  baseGoerli,
  optimismGoerli,
  zoraTestnet,
  optimism,
  base,
  modeTestnet
} from 'wagmi/chains';

export function smartAccountCompatibleChains() {
  return [
    optimismGoerli.name,
    baseGoerli.name,
    zoraTestnet.name,
    modeTestnet.name,
    zkSyncTestnet.name,
    optimism.name,
    base.name
  ] as string[];
}
