import { Typography, Stack, Box } from '@mui/material';
import { ArrowForward, Close } from '@mui/icons-material';
import { TypeOptions } from 'react-toastify';
import { SelectedIdentityType } from '../../types/ProfleType';
import { ProfileSection } from '../ProfileSection';
import { AddressSection } from '../AddressSection';
import { normalizeNumberPrecision } from '../../utils/formats';

export function TransferToastContent({
  from,
  to,
  usdAmount,
  status
}: {
  from: SelectedIdentityType;
  to: SelectedIdentityType;
  usdAmount: number;
  status?: TypeOptions;
}) {
  return (
    <Box
      minWidth={300}
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between">
      {from.type === 'profile'
        ? from.identity.profile && <ProfileSection profile={from.identity.profile} />
        : from.identity.address && <AddressSection identity={from.identity} />}
      <Stack mx={1} width={50} alignItems="center" justifyContent="center">
        <Typography noWrap variant="subtitle2">
          ${normalizeNumberPrecision(usdAmount)}
        </Typography>
        {status === 'error' ? <Close /> : <ArrowForward />}
      </Stack>
      {to.type === 'profile'
        ? to.identity.profile && <ProfileSection profile={to.identity.profile} />
        : to.identity.address && <AddressSection identity={to.identity} />}
    </Box>
  );
}
