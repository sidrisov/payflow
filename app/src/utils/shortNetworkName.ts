import { networks } from './chainConstants';

export function shortNetworkName(network: number) {
  return networks.find((n) => n.chainId === network)?.shortName;
}
