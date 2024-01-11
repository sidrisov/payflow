import { Link, LinkProps, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ProfileType } from '../types/ProfleType';
import { socialLink } from '../utils/dapps';

export function ProfileDisplayNameWithLink({
  profile,
  ...props
}: { profile: ProfileType } & LinkProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Link
      maxWidth={200}
      href={socialLink('payflow', profile.username)}
      target="_blank"
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
