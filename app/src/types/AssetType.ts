import { Address } from 'viem';
import { GetBalanceReturnType } from 'wagmi/actions';

export type AssetType = { address: Address; chainId: number; token?: Address };
export type AssetBalanceType = {
  asset: AssetType;
  balance: GetBalanceReturnType | undefined;
  usdPrice: number;
  usdValue: number;
};
