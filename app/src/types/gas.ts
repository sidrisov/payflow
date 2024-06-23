import { formatEther } from 'viem';
import { normalizeNumberPrecision } from '../utils/formats';

export function getGasFeeText(gasFee: bigint | undefined, ethUsdPrice: number | undefined): string {
  return gasFee !== undefined
    ? gasFee === BigInt(0)
      ? 'sponsored'
      : `$${normalizeNumberPrecision(
          parseFloat(formatEther(gasFee)) * (ethUsdPrice ?? 0)
        )} ≈ ETH ${normalizeNumberPrecision(parseFloat(formatEther(gasFee)))}`
    : '...';
}
