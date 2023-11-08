import { Avatar, Stack, Typography } from '@mui/material';
import { ProfileType } from '../types/ProfleType';

export function ProfileSection(props: { profile: ProfileType; avatarSize?: number }) {
  const { profile, avatarSize } = props;
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Avatar src={profile?.profileImage} sx={{ width: avatarSize, height: avatarSize }} />
      <Stack direction="column" spacing={0.1} alignItems="flex-start">
        <Typography variant="subtitle2">{profile?.displayName}</Typography>
        <Typography variant="caption">@{profile?.username}</Typography>
      </Stack>
    </Stack>
  );
}
