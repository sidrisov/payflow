import { Avatar, AvatarProps } from '@mui/material';
import { ProfileType } from '@payflow/common';
import ProfileAvatar from '../avatars/ProfileAvatar';
import AddressAvatar from '../avatars/AddressAvatar';
import { Social } from '../../generated/graphql/types';

interface UserAvatarProps extends AvatarProps {
  profile?: ProfileType;
  address?: string;
  ensAvatar?: string | null;
  social?: Social;
}

export const UserAvatar = ({ profile, address, ensAvatar, social, ...props }: UserAvatarProps) => {
  if (profile) {
    return <ProfileAvatar profile={profile} {...props} />;
  }
  if (social?.profileImageContentValue?.image?.extraSmall) {
    return <Avatar src={social.profileImageContentValue?.image?.extraSmall} {...props} />;
  }
  if (ensAvatar) {
    return <Avatar src={ensAvatar} {...props} />;
  }
  if (address) {
    return <AddressAvatar address={address} {...props} />;
  }
  return <Avatar {...props}>?</Avatar>;
};
