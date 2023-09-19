import {
  zkSyncTestnet,
  baseGoerli,
  optimismGoerli,
  zoraTestnet,
  lineaTestnet,
  polygonZkEvmTestnet,
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
    lineaTestnet.name,
    polygonZkEvmTestnet.name,
    optimism.name,
    base.name
  ] as string[];
}
