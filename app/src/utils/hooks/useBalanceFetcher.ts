import { useMemo, useState } from 'react';
import { getBalance } from 'wagmi/actions';
import { AssetType, AssetBalanceType } from '../../types/AssetType';
import { BalanceFetchResultType } from '../../types/BalanceFetchResultType';
import { wagmiConfig } from '../wagmiConfig';

export const useBalanceFetcher = (assets: AssetType[]): BalanceFetchResultType => {
  const [balances, setBalances] = useState<AssetBalanceType[]>([]);
  const [fetched, setFetched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useMemo(() => {
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
        const balances = data.map((result, index) => ({
          asset: assets[index],
          balance: result.status === 'fulfilled' ? result.value : undefined
        }));

        setLoading(false);
        setFetched(true);
        setBalances(balances);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
        setFetched(false);
      });
  }, [assets.toString()]);
  return { loading, fetched, balances };
};
