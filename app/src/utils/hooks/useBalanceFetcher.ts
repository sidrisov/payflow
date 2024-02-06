import { useContext, useMemo, useState } from 'react';
import { getBalance } from 'wagmi/actions';
import { AssetType, AssetBalanceType } from '../../types/AssetType';
import { BalanceFetchResultType } from '../../types/BalanceFetchResultType';
import { wagmiConfig } from '../wagmiConfig';
import { formatUnits } from 'viem';
import { GetBalanceData } from 'wagmi/query';
import { ProfileContext } from '../../contexts/UserContext';

export const useBalanceFetcher = (assets: AssetType[]): BalanceFetchResultType => {
  const [balances, setBalances] = useState<AssetBalanceType[]>([]);
  const [fetched, setFetched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { tokenPrices } = useContext(ProfileContext);

  function getAssetValue(assetBalance: GetBalanceData, price: number) {
    const value = formatUnits(assetBalance?.value ?? BigInt(0), assetBalance?.decimals ?? 0);
    return parseFloat(value) * price;
  }

  useMemo(() => {
    if (tokenPrices) {
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
              usdPrice: result.status === 'fulfilled' ? tokenPrices[result.value?.symbol] : 0,
              usdValue: result.status === 'fulfilled' ? getAssetValue(result.value, tokenPrices[result.value?.symbol]) : 0
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
  }, [assets.toString(), tokenPrices]);
  return { loading, fetched, balances };
};
