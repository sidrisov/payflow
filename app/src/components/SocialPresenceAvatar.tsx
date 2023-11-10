import { Avatar, AvatarProps, Tooltip } from '@mui/material';
import { XMPT_DAPP, dAppType } from '../utils/dapps';

export type SocialPresenceAvatarProps = AvatarProps & {
  dappName: dAppType;
  profileName?: string;
};

export default function SocialPresenceAvatar(props: SocialPresenceAvatarProps) {
  const avatarSrc = `/${props.dappName}.svg`;
  const toolTipTitle = XMPT_DAPP === props.dappName ? 'enabled' : props.profileName;

  return (
    <Tooltip title={toolTipTitle}>
      <Avatar {...props} src={avatarSrc} sx={{ width: 15, height: 15 }} />
    </Tooltip>
  );
}
