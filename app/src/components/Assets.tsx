import { AvatarGroup, Box, Stack, Typography } from '@mui/material';

import { formatUnits } from 'viem';
import { AggregatedAssetBalanceSection } from './AggregatedAssetBalanceSection';
import { BalanceFetchResultType } from '../types/BalanceFetchResultType';
import { ActivitySkeletonSection } from './skeletons/ActivitySkeletonSection';
import { useState } from 'react';
import { AssetBalanceType } from '../types/AssetType';
import { AiFillEyeInvisible } from 'react-icons/ai';
import TokenAvatar from './avatars/TokenAvatar';

const MAX_ASSETS_TO_SHOW = 6;
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

type AssetsProps = {
  assetBalancesResult: BalanceFetchResultType;
  balanceVisible: boolean;
};

export default function Assets({ assetBalancesResult, balanceVisible }: AssetsProps) {
  const [showAll, setShowAll] = useState<boolean>(false);

  const { isLoading, isFetched, balances } = assetBalancesResult;

  const nonZeroAggregatedBalances = balances && aggregateAssets(balances);

  return (
    <Stack
      spacing={1}
      sx={{
        pb: 1.5,
        px: 1.5,
        overflowY: 'scroll'
      }}>
      {isLoading || !isFetched ? (
        <ActivitySkeletonSection />
      ) : isFetched && nonZeroAggregatedBalances ? (
        <>
          {nonZeroAggregatedBalances
            .slice(0, showAll ? nonZeroAggregatedBalances.length : MAX_ASSETS_TO_SHOW)
            .map((assetBalance) => {
              return (
                <AggregatedAssetBalanceSection
                  key={`network_asset_balance_${assetBalance.tokenId}`}
                  assetBalances={assetBalance.assets}
                  balance={formatUnits(
                    assetBalance.totalBalance,
                    assetBalance.assets[0]?.asset.token.decimals ?? 0
                  )}
                  usdValue={assetBalance.totalUSDBalance}
                  balanceVisible={balanceVisible}
                />
              );
            })}

          {nonZeroAggregatedBalances && nonZeroAggregatedBalances.length > MAX_ASSETS_TO_SHOW && (
            <Box
              py={0.5}
              px={1}
              height={55}
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="flex-start"
              sx={{
                border: 1,
                borderRadius: 5,
                borderColor: 'divider',
                cursor: 'pointer'
              }}
              onClick={() => setShowAll(!showAll)}>
              {showAll ? (
                <>
                  <AiFillEyeInvisible size={32} />
                  <Typography ml={1} variant="subtitle2" fontWeight="bold">
                    Hide tokens
                  </Typography>
                </>
              ) : (
                <>
                  <AvatarGroup
                    max={3}
                    spacing="small"
                    sx={{ '& .MuiAvatar-root': { borderStyle: 'none' } }}>
                    {nonZeroAggregatedBalances
                      .slice(MAX_ASSETS_TO_SHOW, MAX_ASSETS_TO_SHOW + 3)
                      .map((asset) => (
                        <TokenAvatar
                          key={asset.tokenId}
                          token={asset.assets[0].asset.token}
                          sx={{ width: 32, height: 32 }}
                        />
                      ))}
                  </AvatarGroup>
                  <Typography ml={1} variant="subtitle2" fontWeight="bold">
                    More tokens
                  </Typography>
                </>
              )}
            </Box>
          )}
        </>
      ) : (
        <Typography variant="subtitle2" textAlign="center">
          Couldn't fetch. Try again!
        </Typography>
      )}
    </Stack>
  );
}
