import { formatEther } from 'viem';
import { normalizeNumberPrecision } from '../utils/normalizeNumberPrecision';

export function getGasFeeText(gasFee: bigint | undefined, ethUsdPrice: number | undefined): string {
  return 'fee: '.concat(
    gasFee !== undefined
      ? gasFee === BigInt(0)
        ? 'sponsored'
        : `$${normalizeNumberPrecision(
            parseFloat(formatEther(gasFee)) * (ethUsdPrice ?? 0)
          )} ≈ ETH ${normalizeNumberPrecision(parseFloat(formatEther(gasFee)))}`
      : '...'
  );
}
