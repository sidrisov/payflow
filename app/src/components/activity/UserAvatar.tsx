import { Avatar, AvatarProps } from '@mui/material';
import { ProfileType, SocialInfoType } from '@payflow/common';
import ProfileAvatar from '../avatars/ProfileAvatar';
import AddressAvatar from '../avatars/AddressAvatar';

interface UserAvatarProps extends AvatarProps {
  profile?: ProfileType;
  address?: string;
  ensAvatar?: string | null;
  social?: SocialInfoType;
}

export const UserAvatar = ({ profile, address, ensAvatar, social, ...props }: UserAvatarProps) => {
  if (profile) {
    return <ProfileAvatar profile={profile} {...props} />;
  }
  if (social?.profileImage) {
    return <Avatar src={social.profileImage} {...props} />;
  }
  if (ensAvatar) {
    return <Avatar src={ensAvatar} {...props} />;
  }
  if (address) {
    return <AddressAvatar address={address} {...props} />;
  }
  return <Avatar {...props}>?</Avatar>;
};
