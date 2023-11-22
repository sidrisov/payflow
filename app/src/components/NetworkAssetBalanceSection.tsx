import { Avatar, Badge, Box, Stack, Typography } from '@mui/material';
import NetworkAvatar from './NetworkAvatar';

export function NetworkAssetBalanceSection(props: {
  network: number;
  asset: string;
  balance: string;
  price: number;
}) {
  return (
    <Box
      p={1}
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ border: 1, borderRadius: 5 }}>
      <Box display="flex" flexDirection="row" alignItems="center" justifyContent="flex-start">
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <NetworkAvatar
              network={props.network}
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
          <Typography variant="caption">{parseFloat(props.balance).toPrecision(3)}</Typography>
        </Stack>
      </Box>

      <Typography>${(parseFloat(props.balance) * props.price).toPrecision(3)}</Typography>
    </Box>
  );
}
