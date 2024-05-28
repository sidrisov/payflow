import { Address } from 'viem';
import { GetBalanceReturnType } from 'wagmi/actions';
import { Token } from '../utils/erc20contracts';

export type AssetType = { address: Address; chainId: number; token: Token };
export type AssetBalanceType = {
  asset: AssetType;
  balance: GetBalanceReturnType | undefined;
  usdPrice: number;
  usdValue: number;
};
