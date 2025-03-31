import { Avatar, Badge, Stack, Typography } from '@mui/material';
import FarcasterAvatar from './avatars/FarcasterAvatar';
import { SocialInfoType } from '@payflow/common';

export function FarcasterProfileSection({
  social,
  avatarSize,
  fontSize,
  maxWidth
}: {
  social: SocialInfoType;
  avatarSize?: number;
  fontSize?: number;
  maxWidth?: number;
}) {
  return (
    <Stack maxWidth={maxWidth ?? 130} direction="row" spacing={0.5} alignItems="center">
      <Badge
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        overlap="circular"
        badgeContent={<FarcasterAvatar size={16} />}>
        <Avatar
          src={social.profileImage}
          sx={{ width: avatarSize, height: avatarSize }}
        />
      </Badge>

      <Stack
        minWidth={75}
        spacing={0.1}
        alignItems="flex-start"
        sx={{
          overflowX: 'scroll'
        }}>
        <Typography noWrap variant="subtitle2" fontSize={fontSize}>
          {social.profileDisplayName}
        </Typography>
        <Typography noWrap variant="caption">
          @{social.profileName}
        </Typography>
      </Stack>
    </Stack>
  );
}
