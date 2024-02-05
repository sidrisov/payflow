import { useMemo, useState } from 'react';
import { getBalance } from 'wagmi/actions';
import { AssetType, AssetBalanceType } from '../../types/AssetType';
import { BalanceFetchResultType } from '../../types/BalanceFetchResultType';
import { wagmiConfig } from '../wagmiConfig';
import { formatUnits } from 'viem';
import { ETH_TOKEN, DEGEN_TOKEN, USDC_TOKEN } from '../erc20contracts';
import { GetBalanceData } from 'wagmi/query';

export const useBalanceFetcher = (
  assets: AssetType[],
  ethUsdPrice: number | undefined
): BalanceFetchResultType => {
  const [balances, setBalances] = useState<AssetBalanceType[]>([]);
  const [fetched, setFetched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  function getTokenPrice(token: string | undefined) {
    let price = 0;
    switch (token) {
      case ETH_TOKEN:
        if (ethUsdPrice) {
          price = ethUsdPrice;
        }
        break;
      case DEGEN_TOKEN:
        price = 0.00258;
        break;
      case USDC_TOKEN:
        price = 1;
        break;
    }
    return price;
  }

  function getAssetValue(assetBalance: GetBalanceData | undefined) {
    const value = formatUnits(assetBalance?.value ?? BigInt(0), assetBalance?.decimals ?? 0);
    const price = getTokenPrice(assetBalance?.symbol);
    return parseFloat(value) * price;
  }

  useMemo(() => {
    if (ethUsdPrice) {
      setLoading(true);

      Promise.allSettled(
        assets.map((asset) =>
          getBalance(wagmiConfig, {
            address: asset.address,
            chainId: asset.chainId,
            token: asset.token
          })
        )
      )
        .then((data) => {
          const balances = data
            .map((result, index) => ({
              asset: assets[index],
              balance: result.status === 'fulfilled' ? result.value : undefined,
              usdPrice: result.status === 'fulfilled' ? getTokenPrice(result.value?.symbol) : 0,
              usdValue: result.status === 'fulfilled' ? getAssetValue(result.value) : 0
            }))
            .sort((left, right) => Number(right.usdValue - left.usdValue));

          setLoading(false);
          setFetched(true);
          setBalances(balances);
        })
        .catch((error) => {
          console.error(error);
          setLoading(false);
          setFetched(false);
        });
    }
  }, [assets.toString(), ethUsdPrice]);
  return { loading, fetched, balances };
};
