import { Address } from 'viem';
import { FetchBalanceResult } from 'wagmi/actions';

export type AssetType = { address: Address; chainId: number; token?: Address };
export type AssetBalanceType = { asset: AssetType; balance: FetchBalanceResult | undefined };
