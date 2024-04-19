import { Avatar, Stack, Typography } from '@mui/material';
import { IdentityType } from '../types/ProfleType';
import AddressAvatar from './avatars/AddressAvatar';
import { shortenWalletAddressLabel } from '../utils/address';
import { useEnsAvatar, useEnsName } from 'wagmi';
import CopyToClipboardIconButton from './buttons/CopyToClipboardIconButton';
import { useBaseName, useDegenName } from '../utils/queries/domainNames';

export function AddressSection(props: {
  identity: IdentityType;
  fontSize?: number;
  maxWidth?: number;
  copy?: boolean;
}) {
  const { identity, fontSize, maxWidth, copy = true } = props;

  const { data: ensName, isFetched } = useEnsName({
    address: identity.address,
    chainId: 1,
    query: {
      enabled: !identity.meta?.ens,
      staleTime: 300_000
    }
  });

  const { data: baseName, isFetched: isBaseNameFetched } = useBaseName(
    identity.address,
    isFetched && !ensName
  );

  const { data: degenName } = useDegenName(
    identity.address,
    (isFetched && !ensName) || (isBaseNameFetched && !baseName)
  );

  const avatar = useEnsAvatar({
    name: identity.meta?.ens ?? (ensName as string),
    chainId: 1,
    query: {
      enabled:
        !identity.meta?.ensAvatar && (identity.meta?.ens !== undefined || ensName !== undefined),
      staleTime: 300_000
    }
  });

  const ens = identity.meta?.ens || ensName || baseName || degenName;

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
        {ens && (
          <Typography noWrap variant="subtitle2" fontSize={fontSize}>
            {ens}
          </Typography>
        )}

        <Stack direction="row" spacing={0.1} alignItems="center">
          <Typography noWrap variant={ens ? 'caption' : 'subtitle2'} {...(!ens && { fontSize })}>
            {shortenWalletAddressLabel(identity.address)}
          </Typography>
          {copy && <CopyToClipboardIconButton tooltip="Copy address" value={identity.address} />}
        </Stack>
      </Stack>
    </Stack>
  );
}
