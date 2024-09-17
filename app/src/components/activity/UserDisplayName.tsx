import { Typography } from '@mui/material';
import { ProfileType } from '../../types/ProfileType';
import { ProfileDisplayNameWithLink } from './ProfileDisplayNameWithLink';
import { AddressOrEnsWithLink } from './AddressOrEnsWithLink';
import { Address } from 'viem';
import { Social } from '../../generated/graphql/types';

interface UserDisplayNameProps {
  profile?: ProfileType;
  address?: Address;
  ens?: string;
  social?: Social;
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
      <Typography
        noWrap
        variant="caption"
        fontSize={12}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}>
        {social.profileDisplayName} @{social.profileName}
      </Typography>
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
