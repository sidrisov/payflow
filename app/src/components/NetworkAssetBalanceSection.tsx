import { Badge, Box, Stack, Typography } from '@mui/material';
import NetworkAvatar from './avatars/NetworkAvatar';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../utils/formats';
import TokenAvatar from './avatars/TokenAvatar';
import { AssetType } from '../types/AssetType';

export function NetworkAssetBalanceSection(props: {
  chainId: number;
  asset: AssetType;
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
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <NetworkAvatar
              tooltip
              chainId={props.chainId}
              sx={{
                width: 15,
                height: 15
              }}
            />
          }>
          <TokenAvatar token={props.asset.token} sx={{ width: 30, height: 30 }} />
        </Badge>
        <Stack ml={1} direction="column" spacing={0.2}>
          <Typography variant="subtitle2">{props.asset.token.name}</Typography>
          <Typography variant="caption">
            {formatAmountWithSuffix(normalizeNumberPrecision(parseFloat(props.balance)))}
          </Typography>
        </Stack>
      </Box>

      <Typography>${props.usdValue.toFixed(1)}</Typography>
    </Box>
  );
}
