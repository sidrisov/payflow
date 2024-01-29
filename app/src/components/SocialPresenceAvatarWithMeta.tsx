import { Stack, StackProps, Typography } from '@mui/material';
import { LENS_DAPP, XMPT_DAPP, dAppType } from '../utils/dapps';
import SocialPresenceAvatar from './SocialPresenceAvatar';

export type SocialPresenceAvatarProps = StackProps & {
  dappName: dAppType;
  profileName?: string;
  followerCount?: number;
};

export default function SocialPresenceAvatarWithMeta({
  dappName,
  profileName,
  followerCount,
  ...props
}: SocialPresenceAvatarProps) {
  const normalizedProfileName =
    XMPT_DAPP === dappName
      ? 'enabled'
      : LENS_DAPP === dappName
      ? profileName?.replace('lens/@', '')
      : profileName;

  return (
    <Stack {...props} spacing={1} direction="row" alignItems="center">
      <SocialPresenceAvatar dappName={dappName} />
      <Typography variant="caption" fontWeight="bold">
        {normalizedProfileName}
      </Typography>
      {followerCount && (
        <Typography variant="caption" fontWeight="bold">
          ({followerCount})
        </Typography>
      )}
    </Stack>
  );
}
