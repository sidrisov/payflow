import { Avatar, AvatarProps } from '@mui/material';
import Blockies from 'react-blockies';

export type AddressAvatarProps = AvatarProps & {
  address: string;
  scale?: number;
};

export default function AddressAvatar({ address, scale, ...props }: AddressAvatarProps) {
  return (
    <Avatar {...props}>
      <Blockies seed={address.toLowerCase()} scale={scale ? scale : 5} />
    </Avatar>
  );
}
