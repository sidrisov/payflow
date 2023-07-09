import { Avatar, AvatarProps } from '@mui/material';
import Blockies from 'react-blockies';

export type AddressAvatarProps = AvatarProps & {
  address: string;
  scale?: number;
};

export default function AddressAvatar(props: AddressAvatarProps) {
  return (
    <Avatar {...props}>
      <Blockies seed={props.address.toLowerCase()} scale={props.scale ? props.scale : 5} />
    </Avatar>
  );
}
