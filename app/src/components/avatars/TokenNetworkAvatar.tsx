import { Badge, SxProps } from '@mui/material';
import { Token } from '@payflow/common';
import NetworkAvatar from './NetworkAvatar';
import TokenAvatar from './TokenAvatar';

interface TokenNetworkAvatarProps {
  token: Token;
  size?: number;
  badgeSize?: number;
  sx?: SxProps;
}

export default function TokenNetworkAvatar({
  token,
  size = 24,
  badgeSize = 12,
  sx
}: TokenNetworkAvatarProps) {
  return (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent={
        <NetworkAvatar chainId={token.chainId} sx={{ width: badgeSize, height: badgeSize }} />
      }>
      <TokenAvatar
        token={token}
        sx={{
          width: size,
          height: size,
          ...sx
        }}
      />
    </Badge>
  );
}
