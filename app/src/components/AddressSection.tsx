import { Avatar, Stack, Typography } from '@mui/material';
import { MetaType, ProfileType } from '../types/ProfleType';
import AddressAvatar from './AddressAvatar';
import { shortenWalletAddressLabel } from '../utils/address';

export function AddressSection(props: { meta: MetaType }) {
  const { meta } = props;
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {meta.ensAvatar ? (
        <Avatar src={meta.ensAvatar} />
      ) : (
        <AddressAvatar address={meta.addresses[0] ?? '0x'} />
      )}

      <Stack direction="column" spacing={0.1} alignItems="flex-start">
        <Typography variant="subtitle2">{shortenWalletAddressLabel(meta.addresses[0])}</Typography>
        {meta.ens && <Typography variant="caption">{meta.ens}</Typography>}
      </Stack>
    </Stack>
  );
}
