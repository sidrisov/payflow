import { getNetwork } from 'wagmi/actions';

export default function getNetworkImageSrc(network: number | string): string {
  const fileName =
    typeof network === 'number'
      ? getNetwork().chains.find((c) => c.id === (network as number))?.name
      : network;

  if (!fileName) {
    throw new Error(`Chain ${network} not supported!`);
  }

  return `/networks/${fileName}.png`;
}
