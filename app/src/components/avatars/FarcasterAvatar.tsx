import React from 'react';
import { Avatar, AvatarProps } from '@mui/material';

interface FarcasterAvatarProps extends Omit<AvatarProps, 'src'> {
  size?: number;
}

const FarcasterAvatar: React.FC<FarcasterAvatarProps> = ({ size, ...props }) => (
  <Avatar src="/farcaster.svg" variant="rounded" sx={{ width: size, height: size }} {...props} />
);

export default FarcasterAvatar;
