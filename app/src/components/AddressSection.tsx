import { Avatar, Stack, Typography } from '@mui/material';
import { MetaType } from '../types/ProfleType';
import AddressAvatar from './AddressAvatar';
import { shortenWalletAddressLabel } from '../utils/address';

export function AddressSection(props: { meta: MetaType; fontSize?: number }) {
  const { meta, fontSize } = props;
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {meta.ensAvatar ? (
        <Avatar src={meta.ensAvatar} />
      ) : (
        <AddressAvatar address={meta.addresses[0] ?? '0x'} />
      )}

      <Stack width={80} direction="column" spacing={0.1} alignItems="flex-start" overflow="scroll">
        <Typography variant="subtitle2" fontSize={fontSize}>
          {shortenWalletAddressLabel(meta.addresses[0])}
        </Typography>
        {meta.ens && <Typography variant="caption">{meta.ens}</Typography>}
      </Stack>
    </Stack>
  );
}
