import { getBalance } from 'wagmi/actions';
import { AssetType, AssetBalanceType } from '../../types/AssetType';
import { privyWagmiConfig } from '../wagmiConfig';
import { formatUnits } from 'viem';
import { GetBalanceData } from 'wagmi/query';
import { useQuery } from '@tanstack/react-query';
import { useTokenPrices as useTokenPrices } from './prices';

function getAssetValue(assetBalance: GetBalanceData, price: number) {
  const value = formatUnits(assetBalance?.value ?? BigInt(0), assetBalance?.decimals ?? 0);
  return parseFloat(value) * price;
}

export const useAssetBalances = (assets: AssetType[]) => {
  const { isFetched, data: tokenPrices } = useTokenPrices();

  return useQuery({
    enabled: isFetched && Boolean(tokenPrices) && assets && assets.length > 0,
    queryKey: ['balances', { assets, tokenPrices }],
    staleTime: Infinity,
    refetchInterval: 60_000,
    queryFn: () =>
      Promise.allSettled(
        assets.map((asset) =>
          getBalance(privyWagmiConfig, {
            address: asset.address,
            chainId: asset.chainId,
            token: asset.token
          })
        )
      ).then((data) => {
        return (
          tokenPrices
            ? data
                .map((result, index) => ({
                  asset: assets[index],
                  balance: result.status === 'fulfilled' ? result.value : undefined,
                  usdPrice: result.status === 'fulfilled' ? tokenPrices[result.value?.symbol] : 0,
                  usdValue:
                    result.status === 'fulfilled'
                      ? getAssetValue(result.value, tokenPrices[result.value?.symbol])
                      : 0
                }))
                .sort((left, right) => Number(right.usdValue - left.usdValue))
            : undefined
        ) as AssetBalanceType[];
      })
  });
};
