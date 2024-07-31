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
  usdValue
}: {
  assets: AssetType[];
  balance: string;
  usdValue: number;
}) {
  return (
    <Box
      p={1}
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ border: 1.5, borderRadius: 5, borderColor: 'divider' }}>
      <Box display="flex" flexDirection="row" alignItems="center" justifyContent="flex-start">
        <Tooltip
          title={
            <Typography variant="caption">
              Balance of <b>{assets[0].token.name}</b> across chains:{' '}
              <b>
                {assets.map((asset, index) => (
                  <Fragment key={index}>
                    {getNetworkDisplayName(asset.token.chainId)}
                    {index !== assets.length - 1 ? ', ' : ''}
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
                max={3}
                color="inherit"
                total={assets.length}
                sx={{
                  '& .MuiAvatar-root': {
                    borderStyle: 'none',
                    border: 0,
                    width: 14,
                    height: 14,
                    fontSize: 10
                  }
                }}>
                {[...Array(Math.min(3, assets.length))].map((_item, i) => (
                  <NetworkAvatar chainId={assets[i].chainId} />
                ))}
              </AvatarGroup>
            }>
            <TokenAvatar token={assets[0].token} sx={{ width: 30, height: 30 }} />
          </Badge>
        </Tooltip>
        <Stack ml={2} direction="column" spacing={0.2}>
          <Typography variant="subtitle2">{assets[0].token.name}</Typography>
          <Typography variant="caption">
            {formatAmountWithSuffix(normalizeNumberPrecision(parseFloat(balance)))}
          </Typography>
        </Stack>
      </Box>

      <Typography>${usdValue.toFixed(1)}</Typography>
    </Box>
  );
}
