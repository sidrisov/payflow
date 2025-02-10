import { AvatarGroup, Badge, Box, Stack, Typography, Collapse } from '@mui/material';
import NetworkAvatar from './avatars/NetworkAvatar';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../utils/formats';
import TokenAvatar from './avatars/TokenAvatar';
import { AssetBalanceType } from '../types/AssetType';
import { getNetworkDisplayName } from '../utils/networks';
import React from 'react';
import { formatUnits } from 'viem';

export function AggregatedAssetBalanceSection({
  assetBalances,
  balance,
  usdValue,
  balanceVisible
}: {
  assetBalances: AssetBalanceType[];
  balance: string;
  usdValue: number;
  balanceVisible: boolean;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const uniqueAssets = assetBalances.filter(
    (balance, index, self) =>
      index === self.findIndex((b) => b.asset.chainId === balance.asset.chainId)
  );

  const isCollapsible = assetBalances.length > 1;

  return (
    <Box>
      <Box
        py={0.5}
        px={1}
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          border: 1,
          borderRadius: isCollapsible && collapsed ? '16px 16px 0 0' : 5,
          borderColor: 'divider',
          cursor: isCollapsible ? 'pointer' : 'default'
        }}
        onClick={() => isCollapsible && setCollapsed(!collapsed)}>
        <Box display="flex" flexDirection="row" alignItems="center" justifyContent="flex-start">
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <AvatarGroup
                key={`asset_chains_avatar_group_${uniqueAssets[0].asset.token.id}`}
                max={3}
                color="inherit"
                total={uniqueAssets.length}
                sx={{
                  '& .MuiAvatar-root': {
                    borderStyle: 'none',
                    width: 14,
                    height: 14,
                    fontSize: 10
                  },
                  gap: 0.2
                }}>
                {[...Array(Math.min(3, uniqueAssets.length))].map((_item, i) => (
                  <NetworkAvatar
                    key={`asset_chains_avatar_group_${uniqueAssets[0].asset.token.id}_${uniqueAssets[i].asset.chainId}`}
                    chainId={uniqueAssets[i].asset.chainId}
                  />
                ))}
              </AvatarGroup>
            }>
            <TokenAvatar token={uniqueAssets[0].asset.token} sx={{ width: 35, height: 35 }} />
          </Badge>
          <Stack ml={2} spacing={0.2}>
            <Typography variant="subtitle2" textTransform="uppercase" fontWeight="bold">
              {uniqueAssets[0].asset.token.id}
            </Typography>
            <Typography fontSize={14} fontWeight="bold" color="text.secondary">
              {balanceVisible
                ? formatAmountWithSuffix(normalizeNumberPrecision(parseFloat(balance)))
                : '*****'}
            </Typography>
          </Stack>
        </Box>

        <Typography fontSize={16} fontWeight="bold" mr={1}>
          {balanceVisible ? `$${formatAmountWithSuffix(usdValue.toFixed(1))}` : '*****'}
        </Typography>
      </Box>

      {isCollapsible && collapsed && (
        <Collapse in={collapsed}>
          <Box
            sx={{
              border: 1,
              borderTop: 0,
              borderRadius: '0 0 16px 16px',
              borderColor: 'divider',
              p: 1
            }}>
            {assetBalances.map((assetBalance, _) => (
              <Box
                key={`${assetBalance.asset.token.id}_${assetBalance.asset.chainId}`}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                py={0.5}>
                <Box display="flex" alignItems="center">
                  <NetworkAvatar
                    chainId={assetBalance.asset.chainId}
                    sx={{ width: 35, height: 35 }}
                  />
                  <Stack direction="column" spacing={0.2} ml={1}>
                    <Typography variant="body2">
                      {getNetworkDisplayName(assetBalance.asset.chainId)}
                    </Typography>
                    <Typography variant="caption" fontWeight={500} color="text.secondary" textTransform="uppercase">
                      {formatAmountWithSuffix(
                        normalizeNumberPrecision(
                          parseFloat(
                            formatUnits(
                              assetBalance.balance?.value ?? BigInt(0),
                              assetBalance.asset.token.decimals
                            )
                          )
                        )
                      )}{' '}
                      {assetBalance.asset.token.id}
                    </Typography>
                  </Stack>
                </Box>
                <Typography variant="body2" fontWeight={500} mr={1}>
                  {balanceVisible
                    ? `$${formatAmountWithSuffix(normalizeNumberPrecision(assetBalance.usdValue))}`
                    : '*****'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
