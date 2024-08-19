import { formatEther } from 'viem';
import { normalizeNumberPrecision } from '../utils/formats';

export function getFeeText(
  type: 'gas' | 'cross-chain',
  fee: bigint | undefined,
  ethUsdPrice: number | undefined
): string {
  return fee !== undefined
    ? fee === BigInt(0)
      ? type === 'gas'
        ? 'sponsored'
        : 'no fee'
      : `$${normalizeNumberPrecision(
          parseFloat(formatEther(fee)) * (ethUsdPrice ?? 0)
        )} ≈ ETH ${normalizeNumberPrecision(parseFloat(formatEther(fee)))}`
    : '...';
}
