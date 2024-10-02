import React from 'react';
import { Avatar, AvatarProps } from '@mui/material';

interface MoxieAvatarProps extends Omit<AvatarProps, 'src'> {
  size?: number;
}

const MoxieAvatar: React.FC<MoxieAvatarProps> = ({ size, ...props }) => (
  <Avatar src="/moxie.png" variant="rounded" sx={{ width: size, height: size }} {...props} />
);

export default MoxieAvatar;
