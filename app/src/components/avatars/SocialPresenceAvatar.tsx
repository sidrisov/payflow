import { Avatar, AvatarProps } from '@mui/material';
import { dAppType } from '../../utils/dapps';

export type SocialPresenceAvatarProps = AvatarProps & {
  dappName: dAppType;
};

export default function SocialPresenceAvatar({ dappName, ...props }: SocialPresenceAvatarProps) {
  const avatarSrc = `/${dappName}.svg`;

  return <Avatar {...props} src={avatarSrc} sx={{ width: 15, height: 15 }} />;
}

export function PowerUserAvatar({ ...props }: AvatarProps) {
  return <Avatar {...props} src="/power.png" sx={{ width: 15, height: 15 }} />;
}
