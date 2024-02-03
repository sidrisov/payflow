import { formatEther } from "viem";

export function getGasFeeText(gasFee: bigint | undefined, ethUsdPrice: number | undefined): string {
  return 'fee: '.concat(
    gasFee !== undefined
      ? gasFee === BigInt(0)
        ? 'sponsored'
        : `${parseFloat(formatEther(gasFee)).toFixed(5)} ETH ≈ $${(
            parseFloat(formatEther(gasFee)) * (ethUsdPrice ?? 0)
          ).toFixed(2)}`
      : '...'
  );
}
