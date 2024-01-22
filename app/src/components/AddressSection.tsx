import { Avatar, Stack, Typography } from '@mui/material';
import { IdentityType } from '../types/ProfleType';
import AddressAvatar from './AddressAvatar';
import { shortenWalletAddressLabel } from '../utils/address';
import { useEnsAvatar, useEnsName } from 'wagmi';

export function AddressSection(props: {
  identity: IdentityType;
  fontSize?: number;
  maxWidth?: number;
}) {
  const { identity: identity, fontSize, maxWidth } = props;

  const { data: ensName } = useEnsName({
    enabled: !identity.meta?.ens,
    address: identity.address,
    chainId: 1,
    cacheTime: 300_000
  });

  const avatar = useEnsAvatar({
    enabled:
      !identity.meta?.ensAvatar && (identity.meta?.ens !== undefined || ensName !== undefined),
    name: identity.meta?.ens ?? ensName,
    chainId: 1,
    cacheTime: 300_000
  });

  return (
    <Stack maxWidth={maxWidth ?? 130} direction="row" spacing={0.5} alignItems="center">
      {identity.meta?.ensAvatar || (avatar.isSuccess && avatar.data) ? (
        <Avatar
          src={identity.meta?.ensAvatar ?? (avatar.isSuccess && avatar.data ? avatar.data : '')}
        />
      ) : (
        <AddressAvatar address={identity.address} />
      )}
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
          {shortenWalletAddressLabel(identity.address)}
        </Typography>
        {(identity.meta?.ens || ensName) && (
          <Typography noWrap variant="caption">
            {identity.meta?.ens ?? ensName}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
