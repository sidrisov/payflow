import { useNetwork } from 'wagmi';
import { networks } from './constants';

export function shortNetworkName(network: string) {
  const { chains } = useNetwork();

  return networks.find((n) => n.chainId === chains.find((c) => c.name === network)?.id)?.shortName;
}
