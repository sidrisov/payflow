import { SelectAll } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Chip,
  ChipProps,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useContext, useState } from 'react';

import { Chain, formatEther } from 'viem';
import { useNetwork } from 'wagmi';
import { NetworkAssetBalanceSection } from './NetworkAssetBalanceSection';
import { BalanceFetchResultType } from '../types/BalanceFetchResultType';
import { UserContext } from '../contexts/UserContext';
import { FlowWalletType, WalletType } from '../types/FlowType';

export default function Assets(props: {
  wallets: FlowWalletType[];
  balanceFetchResult: BalanceFetchResultType;
}) {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedNetwork, setSelectedNetwork] = useState<Chain>();

  const { chains } = useNetwork();

  const { loading, fetched, balances } = props.balanceFetchResult;

  const { ethUsdPrice } = useContext(UserContext);

  function AssetNetworkSelectorChip(props: ChipProps & { wallet?: WalletType }) {
    const wallet = props.wallet;
    return (
      <Chip
        {...props}
        clickable
        icon={
          wallet ? (
            <Avatar src={`/networks/${wallet.network}.png`} sx={{ width: 20, height: 20 }} />
          ) : (
            <SelectAll />
          )
        }
        label={
          <Typography variant={!smallScreen ? 'subtitle2' : 'caption'}>
            {wallet ? wallet.network : 'All networks'}
          </Typography>
        }
        onClick={async () => {
          if (wallet) {
            setSelectedNetwork(chains.find((c) => c.name === wallet.network));
          } else {
            setSelectedNetwork(undefined);
          }
        }}
        sx={{
          backgroundColor: (
            wallet ? selectedNetwork?.name === wallet.network : selectedNetwork === undefined
          )
            ? ''
            : 'inherit'
        }}
      />
    );
  }

  return (
    <Box m={1}>
      <Stack p={1} direction="row" spacing={1} overflow="scroll">
        <AssetNetworkSelectorChip />
        {props.wallets.map((wallet) => {
          return <AssetNetworkSelectorChip wallet={wallet} />;
        })}
      </Stack>
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
