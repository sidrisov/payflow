import { Button, Stack, Typography } from '@mui/material';

import { formatUnits } from 'viem';
import { AggregatedAssetBalanceSection } from './AggregatedAssetBalanceSection';
import { BalanceFetchResultType as AssetBalancesResultType } from '../types/BalanceFetchResultType';
import { ActivitySkeletonSection } from './skeletons/ActivitySkeletonSection';
import { useState } from 'react';
import { AssetBalanceType } from '../types/AssetType';

interface AggregatedAssetBalances {
  tokenId: string;
  assets: AssetBalanceType[];
  totalBalance: bigint;
  totalUSDBalance: number;
}

const aggregateAssets = (balances: AssetBalanceType[]): AggregatedAssetBalances[] => {
  const aggregationMap: Record<string, AggregatedAssetBalances> = {};

  balances
    .filter((assetBalance) => assetBalance.balance?.value && assetBalance.balance.value > BigInt(0))
    .forEach((assetBalance) => {
      const tokenId = assetBalance.asset.token.underlyingToken?.id ?? assetBalance.asset.token.id;

      if (!aggregationMap[tokenId]) {
        aggregationMap[tokenId] = {
          tokenId,
          assets: [],
          totalBalance: 0n,
          totalUSDBalance: 0
        };
      }

      aggregationMap[tokenId].assets.push(assetBalance);
      aggregationMap[tokenId].totalBalance += assetBalance.balance?.value ?? BigInt(0);
      aggregationMap[tokenId].totalUSDBalance += assetBalance.usdValue;
    });

  return Object.values(aggregationMap)
    .filter((asset) => asset.totalBalance !== BigInt(0))
    .sort((left, right) => right.totalUSDBalance - left.totalUSDBalance);
};

export default function Assets({
  assetBalancesResult: { isLoading, isFetched, balances }
}: {
  assetBalancesResult: AssetBalancesResultType;
}) {
  const [showAll, setShowAll] = useState<boolean>(false);

  const nonZeroAggregatedBalances = balances && aggregateAssets(balances);

  return (
    <Stack p={0.5} spacing={0.5} width="100%" height={230}>
      <Stack px={1.5} spacing={1} height={180} sx={{ overflowY: 'scroll' }}>
        {isLoading || !isFetched ? (
          <ActivitySkeletonSection />
        ) : isFetched && nonZeroAggregatedBalances ? (
          nonZeroAggregatedBalances
            .slice(0, showAll ? nonZeroAggregatedBalances.length : 3)
            .map((assetBalance) => {
              return (
                <AggregatedAssetBalanceSection
                  key={`network_asset_balance_${assetBalance.tokenId}`}
                  assets={assetBalance.assets.map((asset) => asset.asset)}
                  balance={formatUnits(
                    assetBalance.totalBalance,
                    assetBalance.assets[0]?.asset.token.decimals ?? 0
                  )}
                  usdValue={assetBalance.totalUSDBalance}
                />
              );
            })
        ) : (
          <Typography variant="subtitle2" textAlign="center">
            Couldn't fetch. Try again!
          </Typography>
        )}
      </Stack>
      {nonZeroAggregatedBalances && nonZeroAggregatedBalances.length > 3 && (
        <Button
          color="inherit"
          size="small"
          onClick={async () => {
            setShowAll(!showAll);
          }}
          sx={{ alignSelf: 'center', textTransform: 'none', borderRadius: 10, fontSize: 14 }}>
          {showAll ? 'Show less tokens' : 'Show more tokens'}
        </Button>
      )}
    </Stack>
  );
}
