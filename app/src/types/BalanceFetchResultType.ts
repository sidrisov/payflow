import { AssetBalanceType } from './AssetType';

export type BalanceFetchResultType = {
  isLoading: boolean;
  isFetched: boolean;
  balances: AssetBalanceType[] | undefined;
};
