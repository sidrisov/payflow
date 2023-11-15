import { Avatar, AvatarProps, Tooltip } from '@mui/material';
import { XMPT_DAPP, dAppType } from '../utils/dapps';

export type SocialPresenceAvatarProps = AvatarProps & {
  dappName: dAppType;
  profileName?: string;
};

export default function SocialPresenceAvatar({
  dappName,
  profileName,
  ...props
}: SocialPresenceAvatarProps) {
  const avatarSrc = `/${dappName}.svg`;
  const toolTipTitle = XMPT_DAPP === dappName ? 'enabled' : profileName;

  return (
    <Tooltip title={toolTipTitle}>
      <Avatar {...props} src={avatarSrc} sx={{ width: 15, height: 15 }} />
    </Tooltip>
  );
}
