import { Link, LinkProps, Typography } from '@mui/material';
import { ProfileType } from '../../types/ProfileType';
import { useMobile } from '../../utils/hooks/useMobile';

export function ProfileDisplayNameWithLink({
  profile,
  ...props
}: { profile: ProfileType } & LinkProps) {
  const isMobile = useMobile();

  return (
    <Link
      aria-haspopup="true"
      maxWidth={200}
      href={`/${profile.username}`}
      underline="hover"
      color="inherit"
      overflow="clip"
      textOverflow="ellipsis"
      {...props}>
      <Typography noWrap variant="caption" fontSize={isMobile ? 12 : 14}>
        <b>{profile.displayName}</b> @{profile.username}
      </Typography>
    </Link>
  );
}
