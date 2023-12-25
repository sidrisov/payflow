import { Avatar, AvatarProps, Stack, Tooltip, Typography } from '@mui/material';
import { FARCASTER_DAPP, LENS_DAPP, XMPT_DAPP, dAppType } from '../utils/dapps';

export type SocialPresenceAvatarProps = AvatarProps & {
  dappName: dAppType;
  profileName?: string;
  followerCount?: number;
};

export default function SocialPresenceAvatar({
  dappName,
  profileName,
  followerCount,
  ...props
}: SocialPresenceAvatarProps) {
  const avatarSrc = `/${dappName}.svg`;

  const followedBy =
    dappName === LENS_DAPP || dappName === FARCASTER_DAPP ? `${followerCount} followers` : '';

  const toolTipTitle =
    XMPT_DAPP === dappName
      ? 'enabled'
      : LENS_DAPP === dappName
      ? profileName?.replace('lens/@', '')
      : profileName;

  return (
    <Tooltip
      title={
        <Stack>
          <Typography variant="caption" fontWeight="bold">
            {toolTipTitle}
          </Typography>
          {followedBy && <Typography variant="caption">{followedBy}</Typography>}
        </Stack>
      }>
      <Avatar {...props} src={avatarSrc} sx={{ width: 15, height: 15 }} />
    </Tooltip>
  );
}
