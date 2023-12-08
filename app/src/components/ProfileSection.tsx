import { Stack, Typography } from '@mui/material';
import { ProfileType } from '../types/ProfleType';
import ProfileAvatar from './ProfileAvatar';

export function ProfileSection({
  profile,
  avatarSize,
  fontSize,
  maxWidth
}: {
  profile: ProfileType;
  avatarSize?: number;
  fontSize?: number;
  maxWidth?: number;
}) {
  return (
    <Stack maxWidth={maxWidth ?? 120} direction="row" spacing={0.5} alignItems="center">
      <ProfileAvatar profile={profile} sx={{ width: avatarSize, height: avatarSize }} />
      <Stack direction="column" spacing={0.1} alignItems="flex-start" overflow="scroll">
        <Typography noWrap variant="subtitle2" fontSize={fontSize}>
          {profile?.displayName}
        </Typography>
        <Typography variant="caption">@{profile?.username}</Typography>
      </Stack>
    </Stack>
  );
}
