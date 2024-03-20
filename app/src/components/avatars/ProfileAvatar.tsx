import { Avatar, AvatarProps } from '@mui/material';
import { ProfileType } from '../../types/ProfleType';
import AddressAvatar from './AddressAvatar';

export default function ProfileAvatar({
  profile,
  ...props
}: AvatarProps & { profile: ProfileType }) {
  return profile.profileImage ? (
    <Avatar {...props} alt={profile.displayName ?? profile.username} src={profile.profileImage} />
  ) : (
    <AddressAvatar {...props} address={profile.identity} />
  );
}
