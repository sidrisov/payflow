import { Address, formatUnits, zeroAddress } from 'viem';
import { wagmiConfig } from './wagmi';
import { getBalance } from '@wagmi/core';
import { TokenPrices, getSupportedTokens } from './erc20contracts';

import { GetBalanceReturnType } from '@wagmi/core';
import { FlowType } from '../types/FlowType';

export type AssetType = { address: Address; chainId: number; token?: Address };
export type AssetBalanceType = {
  asset: AssetType;
  balance: GetBalanceReturnType | undefined;
  usdPrice: number;
  usdValue: number;
};

export type BalanceFetchResultType = {
  isLoading: boolean;
  isFetched: boolean;
  balances: AssetBalanceType[] | undefined;
};

export function getTotalBalance(balances: AssetBalanceType[]) {
  const totalBalance = balances
    .filter((balance) => balance.balance)
    .reduce((previousValue, currentValue) => {
      return previousValue + currentValue.usdValue;
    }, 0)
    .toFixed(1);

  console.debug(totalBalance);

  return totalBalance;
}

export function getFlowAssets(flow: FlowType) {
  let assets: AssetType[] = [];
  flow.wallets.forEach((wallet) => {
    const chainId = wallet.network;
    if (chainId) {
      const tokens = getSupportedTokens(chainId);
      tokens.forEach((token) => {
        assets.push({
          address: wallet.address,
          chainId,
          token: token.address !== zeroAddress ? token.address : undefined
        });
      });
    }
  });

  console.log('Assets:', assets);

  return assets;
}

export const getAssetBalances = async (assets: AssetType[], prices: TokenPrices) => {
  const data = await Promise.allSettled(
    assets.map((asset) =>
      getBalance(wagmiConfig, {
        address: asset.address,
        chainId: asset.chainId as any,
        token: asset.token
      })
    )
  );

  return data
    .map((result, index) => ({
      asset: assets[index],
      balance: result.status === 'fulfilled' ? result.value : undefined,
      usdPrice: result.status === 'fulfilled' ? prices[result.value?.symbol] : 0,
      usdValue:
        result.status === 'fulfilled'
          ? getAssetValue(result.value, prices[result.value?.symbol])
          : 0
    }))
    .sort((left, right) => Number(right.usdValue - left.usdValue)) as AssetBalanceType[];
};

function getAssetValue(assetBalance: GetBalanceReturnType, price: number) {
  const value = formatUnits(assetBalance?.value ?? BigInt(0), assetBalance?.decimals ?? 0);
  return parseFloat(value) * price;
}
