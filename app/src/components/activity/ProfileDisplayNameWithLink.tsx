import { Link, LinkProps, Typography } from '@mui/material';
import { ProfileType } from '@payflow/common';
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
      <Typography noWrap variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
        {profile.username}
      </Typography>
    </Link>
  );
}
