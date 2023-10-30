import { AssetBalanceType } from './AssetType';

export type BalanceFetchResultType = {
  loading: boolean;
  fetched: boolean;
  balances: AssetBalanceType[];
};
