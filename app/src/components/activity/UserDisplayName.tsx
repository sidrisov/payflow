import { Link, Typography } from '@mui/material';
import { ProfileType, SocialInfoType } from '@payflow/common';
import { ProfileDisplayNameWithLink } from './ProfileDisplayNameWithLink';
import { AddressOrEnsWithLink } from './AddressOrEnsWithLink';
import { Address } from 'viem';
import { useMobile } from '../../utils/hooks/useMobile'; // Add this import

interface UserDisplayNameProps {
  profile?: ProfileType;
  address?: Address;
  ens?: string;
  social?: SocialInfoType;
  onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: () => void;
}

export const UserDisplayName = ({
  profile,
  address,
  ens,
  social,
  onMouseEnter,
  onMouseLeave
}: UserDisplayNameProps) => {
  const isMobile = useMobile(); // Add this line

  if (profile) {
    return (
      <ProfileDisplayNameWithLink
        profile={profile}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }
  if (social) {
    return (
      <Link
        aria-haspopup="true"
        maxWidth={200}
        href={`/${social.profileName}`}
        underline="hover"
        color="inherit"
        overflow="clip"
        textOverflow="ellipsis"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}>
        <Typography noWrap variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
          {social.profileName}
        </Typography>
      </Link>
    );
  }

  if (address) {
    return <AddressOrEnsWithLink address={address} ens={ens} />;
  }
  return (
    <Typography noWrap variant="caption" fontSize={12}>
      Unknown @unknown
    </Typography>
  );
};
