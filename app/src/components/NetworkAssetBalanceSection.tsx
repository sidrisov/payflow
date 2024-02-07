import { Avatar, Badge, Box, Stack, Typography } from '@mui/material';
import NetworkAvatar from './avatars/NetworkAvatar';
import { normalizeNumberPrecision } from '../utils/normalizeNumberPrecision';

export function NetworkAssetBalanceSection(props: {
  chainId: number;
  asset: string;
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
          <Avatar src={`/coins/${props.asset.toLowerCase()}.png`} sx={{ width: 30, height: 30 }} />
        </Badge>
        <Stack ml={1} direction="column" spacing={0.2}>
          <Typography variant="subtitle2">{props.asset}</Typography>
          <Typography variant="caption">
            {normalizeNumberPrecision(parseFloat(props.balance))}
          </Typography>
        </Stack>
      </Box>

      <Typography>${props.usdValue.toFixed(1)}</Typography>
    </Box>
  );
}
