import { Avatar, Badge, Stack, Typography } from '@mui/material';
import { useQuery } from '@airstack/airstack-react';
import { QUERY_FARCASTER_PROFILE } from '../utils/airstackQueries';

export function FarcasterProfileSection({
  fid,
  avatarSize,
  fontSize,
  maxWidth
}: {
  fid: number;
  avatarSize?: number;
  fontSize?: number;
  maxWidth?: number;
}) {
  const { data: social, loading: loadingSocials } = useQuery(
    QUERY_FARCASTER_PROFILE,
    { fid: fid.toString() },
    {
      cache: true,
      dataFormatter(data) {
        console.log(data);
        return data.Socials.Social[0];
      }
    }
  );

  return (
    !loadingSocials &&
    social && (
      <Stack maxWidth={maxWidth ?? 130} direction="row" spacing={0.5} alignItems="center">
        <Badge
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          overlap="circular"
          badgeContent={<Avatar src="/farcaster.svg" sx={{ width: 16, height: 16 }} />}>
          <Avatar
            src={social?.profileImageContentValue.image.extraSmall}
            sx={{ width: avatarSize, height: avatarSize }}
          />
        </Badge>

        <Stack
          minWidth={75}
          spacing={0.1}
          alignItems="flex-start"
          overflow="auto"
          sx={{
            scrollbarWidth: 'none', // Hide the scrollbar for firefox
            '&::-webkit-scrollbar': {
              display: 'none' // Hide the scrollbar for WebKit browsers (Chrome, Safari, Edge, etc.)
            },
            '&-ms-overflow-style:': {
              display: 'none' // Hide the scrollbar for IE
            }
          }}>
          <Typography noWrap variant="subtitle2" fontSize={fontSize}>
            {social?.profileDisplayName}
          </Typography>
          <Typography noWrap variant="caption">
            @{social?.profileName}
          </Typography>
        </Stack>
      </Stack>
    )
  );
}
