import { Box, Skeleton, Stack } from '@mui/material';
import { useContext, useState } from 'react';

import { Chain, formatEther } from 'viem';
import { useNetwork } from 'wagmi';
import { NetworkAssetBalanceSection } from './NetworkAssetBalanceSection';
import { BalanceFetchResultType } from '../types/BalanceFetchResultType';
import { UserContext } from '../contexts/UserContext';
import { FlowWalletType, WalletType } from '../types/FlowType';
import NetworkSelectorChip from './NetworkSelectorChip';
import NetworkSelectorSection from './NetworkSelectorSection';

export default function Assets(props: {
  wallets: FlowWalletType[];
  balanceFetchResult: BalanceFetchResultType;
}) {
  const { ethUsdPrice } = useContext(UserContext);
  const { wallets } = props;

  const { chains } = useNetwork();
  const [selectedNetwork, setSelectedNetwork] = useState<Chain>();
  const { loading, fetched, balances } = props.balanceFetchResult;

  return (
    <Box m={1}>
      <NetworkSelectorSection
        wallets={wallets as WalletType[]}
        selectedNetwork={selectedNetwork}
        setSelectedNetwork={setSelectedNetwork}
      />
      <Stack p={1} direction="column" spacing={1} minWidth={350} maxHeight={350} overflow="scroll">
        {loading || balances.length === 0 ? (
          <>
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 3 }} />
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 3 }} />
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 3 }} />
          </>
        ) : fetched && ethUsdPrice ? (
          balances
            .filter((assetBalance) => {
              return selectedNetwork
                ? assetBalance.asset.chainId ===
                    chains.find((c) => c.name === selectedNetwork.name)?.id
                : true /* && assetBalance.balance?.value !== BigInt(0) */;
            })
            // TODO: works for now, since we have only eth
            .sort((left, right) =>
              Number((right.balance?.value ?? BigInt(0)) - (left.balance?.value ?? BigInt(0)))
            )
            .map((assetBalance) => {
              return (
                <NetworkAssetBalanceSection
                  network={assetBalance.asset.chainId}
                  asset={assetBalance.balance?.symbol ?? ''}
                  balance={formatEther(assetBalance.balance?.value ?? BigInt(0))}
                  price={ethUsdPrice}
                />
              );
            })
        ) : (
          <></>
        )}
      </Stack>
    </Box>
  );
}
