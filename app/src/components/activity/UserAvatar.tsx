import { Avatar, AvatarProps } from '@mui/material';
import { ProfileType } from '../../types/ProfileType';
import ProfileAvatar from '../avatars/ProfileAvatar';
import AddressAvatar from '../avatars/AddressAvatar';
import { Social } from '../../generated/graphql/types';

interface UserAvatarProps extends AvatarProps {
  profile?: ProfileType;
  address?: string;
  ensAvatar?: string | null;
  social?: Social; // Add this new prop
}

export const UserAvatar = ({ profile, address, ensAvatar, social, ...props }: UserAvatarProps) => {
  if (social?.profileImage) {
    return <Avatar src={social.profileImage} {...props} />;
  }
  if (profile) {
    return <ProfileAvatar profile={profile} {...props} />;
  }
  if (ensAvatar) {
    return <Avatar src={ensAvatar} {...props} />;
  }
  if (address) {
    return <AddressAvatar address={address} {...props} />;
  }
  return <Avatar {...props}>?</Avatar>;
};
