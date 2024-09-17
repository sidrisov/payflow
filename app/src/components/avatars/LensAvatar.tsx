import React from 'react';
import { Avatar, AvatarProps } from '@mui/material';

interface LensAvatarProps extends Omit<AvatarProps, 'src'> {
  size?: number;
}

const LensAvatar: React.FC<LensAvatarProps> = ({ size = 15, ...props }) => (
  <Avatar
    src="/lens.svg"
    sx={{ width: size, height: size }}
    {...props}
  />
);

export default LensAvatar;
