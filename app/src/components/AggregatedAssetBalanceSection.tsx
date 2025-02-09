import { AvatarGroup, Badge, Box, Stack, Tooltip, Typography } from '@mui/material';
import NetworkAvatar from './avatars/NetworkAvatar';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../utils/formats';
import TokenAvatar from './avatars/TokenAvatar';
import { AssetType } from '../types/AssetType';
import { getNetworkDisplayName } from '../utils/networks';
import { Fragment } from 'react/jsx-runtime';

export function AggregatedAssetBalanceSection({
  assets,
  balance,
  usdValue,
  balanceVisible
}: {
  assets: AssetType[];
  balance: string;
  usdValue: number;
  balanceVisible: boolean;
}) {
  const uniqueAssets = assets.filter(
    (asset, index, self) => index === self.findIndex((a) => a.chainId === asset.chainId)
  );
  return (
    <Box
      py={0.5}
      px={1}
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ border: 1, borderRadius: 5, borderColor: 'divider' }}>
      <Box display="flex" flexDirection="row" alignItems="center" justifyContent="flex-start">
        <Tooltip
          title={
            <Typography variant="caption">
              Balance of <b>{uniqueAssets[0].token.name}</b> across chains:{' '}
              <b>
                {uniqueAssets.map((asset, index) => (
                  <Fragment key={index}>
                    {getNetworkDisplayName(asset.token.chainId)}
                    {index !== uniqueAssets.length - 1 ? ', ' : ''}
                  </Fragment>
                ))}
              </b>{' '}
            </Typography>
          }
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                width: 200
              }
            }
          }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <AvatarGroup
                key={`asset_chains_avatar_group_${uniqueAssets[0].token.id}`}
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
                    key={`asset_chains_avatar_group_${uniqueAssets[0].token.id}_${uniqueAssets[i].chainId}`}
                    chainId={uniqueAssets[i].chainId}
                  />
                ))}
              </AvatarGroup>
            }>
            <TokenAvatar token={uniqueAssets[0].token} sx={{ width: 35, height: 35 }} />
          </Badge>
        </Tooltip>
        <Stack ml={2} direction="column" spacing={0.2}>
          <Typography variant="subtitle2" fontWeight="bold">
            {uniqueAssets[0].token.name}
          </Typography>
          <Typography variant="caption" fontWeight={500}>
            {balanceVisible
              ? formatAmountWithSuffix(normalizeNumberPrecision(parseFloat(balance)))
              : '*****'}
          </Typography>
        </Stack>
      </Box>

      <Typography fontWeight={500}>
        {balanceVisible ? `$${formatAmountWithSuffix(usdValue.toFixed(1))}` : '*****'}
      </Typography>
    </Box>
  );
}
