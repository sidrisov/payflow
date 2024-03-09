import { Stack, Typography } from '@mui/material';

import { Chain, formatUnits } from 'viem';
import { NetworkAssetBalanceSection } from './NetworkAssetBalanceSection';
import { BalanceFetchResultType as AssetBalancesResultType } from '../types/BalanceFetchResultType';
import { ActivitySkeletonSection } from './skeletons/ActivitySkeletonSection';

export default function Assets({
  selectedNetwork,
  assetBalancesResult: { isLoading, isFetched, balances }
}: {
  selectedNetwork: Chain | undefined;
  assetBalancesResult: AssetBalancesResultType;
}) {
  return (
    <Stack pt={1} px={1} spacing={1} width="100%" maxHeight={290} overflow="auto">
      {isLoading || !isFetched ? (
        <ActivitySkeletonSection />
      ) : isFetched && balances ? (
        balances
          .filter((assetBalance) => {
            return (
              assetBalance.balance &&
              (selectedNetwork
                ? assetBalance.asset.chainId === selectedNetwork.id
                : true) /* && assetBalance.balance?.value !== BigInt(0) */
            );
          })
          .map((assetBalance) => {
            console.debug(assetBalance);

            return (
              <NetworkAssetBalanceSection
                key={`network_asset_balance_${assetBalance.asset.chainId}_${assetBalance.asset.address}_${assetBalance.asset.token}`}
                chainId={assetBalance.asset.chainId}
                asset={assetBalance.balance?.symbol ?? ''}
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
    </Stack>
  );
}
