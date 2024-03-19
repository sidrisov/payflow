import { Link, LinkProps, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ProfileType } from '../types/ProfleType';

export function ProfileDisplayNameWithLink({
  profile,
  ...props
}: { profile: ProfileType } & LinkProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
