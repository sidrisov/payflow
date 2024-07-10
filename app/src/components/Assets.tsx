import { Button, Stack, Typography } from '@mui/material';

import { Chain, formatUnits } from 'viem';
import { NetworkAssetBalanceSection } from './NetworkAssetBalanceSection';
import { BalanceFetchResultType as AssetBalancesResultType } from '../types/BalanceFetchResultType';
import { ActivitySkeletonSection } from './skeletons/ActivitySkeletonSection';
import { useState } from 'react';

export default function Assets({
  selectedNetwork,
  assetBalancesResult: { isLoading, isFetched, balances }
}: {
  selectedNetwork: Chain | undefined;
  assetBalancesResult: AssetBalancesResultType;
}) {
  const [showAll, setShowAll] = useState<boolean>(false);

  const nonZeroBalances = balances?.filter((assetBalance) => {
    return (
      assetBalance.balance &&
      (selectedNetwork ? assetBalance.asset.chainId === selectedNetwork.id : true) &&
      assetBalance.balance?.value !== BigInt(0)
    );
  });

  return (
    <Stack pt={1} px={1} spacing={1} width="100%" maxHeight={360} overflow="auto">
      {isLoading || !isFetched ? (
        <ActivitySkeletonSection />
      ) : isFetched && nonZeroBalances ? (
        nonZeroBalances
          .filter((assetBalance) => {
            return (
              assetBalance.balance &&
              (selectedNetwork ? assetBalance.asset.chainId === selectedNetwork.id : true) &&
              assetBalance.balance?.value !== BigInt(0)
            );
          })
          .slice(0, showAll ? nonZeroBalances.length : 3)
          .map((assetBalance) => {
            return (
              <NetworkAssetBalanceSection
                key={`network_asset_balance_${assetBalance.asset.chainId}_${assetBalance.asset.address}_${assetBalance.asset.token.tokenAddress}`}
                chainId={assetBalance.asset.chainId}
                asset={assetBalance.asset}
                balance={formatUnits(
                  assetBalance.balance?.value ?? BigInt(0),
                  assetBalance.balance?.decimals ?? 0
                )}
                usdValue={assetBalance.usdValue}
              />
            );
          })
      ) : (
        <Typography variant="subtitle2" textAlign="center">
          Couldn't fetch. Try again!
        </Typography>
      )}
      {nonZeroBalances && nonZeroBalances.length > 3 && (
        <Button
          color="inherit"
          variant="text"
          onClick={async () => {
            setShowAll(!showAll);
          }}
          sx={{ alignSelf: 'center', textTransform: 'none', borderRadius: 10 }}>
          {showAll ? 'Show less tokens' : 'Show more tokens'}
        </Button>
      )}
    </Stack>
  );
}
