import {
  zkSyncTestnet,
  baseGoerli,
  optimismGoerli,
  zoraTestnet,
  optimism} from 'wagmi/chains';

export function smartAccountCompatibleChains() {
  return [optimismGoerli.name, baseGoerli.name, zoraTestnet.name, zkSyncTestnet.name, optimism.name] as string[];
}
