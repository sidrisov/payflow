import { Avatar, Badge, Stack, Typography } from '@mui/material';
import { Social } from '../generated/graphql/types';
import FarcasterAvatar from './avatars/FarcasterAvatar';

export function FarcasterProfileSection({
  social,
  avatarSize,
  fontSize,
  maxWidth
}: {
  social: Social;
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
          src={social.profileImageContentValue?.image?.extraSmall ?? ''}
          sx={{ width: avatarSize, height: avatarSize }}
        />
      </Badge>

      <Stack
        minWidth={75}
        spacing={0.1}
        alignItems="flex-start"
        sx={{
          overflowX: 'scroll',
          scrollbarWidth: 'auto', // Hide the scrollbar for firefox
          '&::-webkit-scrollbar': {
            display: 'none' // Hide the scrollbar for WebKit browsers (Chrome, Safari, Edge, etc.)
          },
          '&-ms-overflow-style:': {
            display: 'none' // Hide the scrollbar for IE
          },
          '-webkit-overflow-scrolling': 'touch', // Improve scrolling on iOS
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
