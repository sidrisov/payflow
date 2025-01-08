import { Typography, Stack, Box } from '@mui/material';
import { ArrowForward, Close } from '@mui/icons-material';
import { TypeOptions } from 'react-toastify';
import { SelectedIdentityType } from '@payflow/common';
import { ProfileSection } from '../ProfileSection';
import { AddressSection } from '../AddressSection';
import { normalizeNumberPrecision } from '../../utils/formats';
import { Token } from '@payflow/common';

export function TransferToastContent({
  from,
  to,
  amount,
  token,
  status
}: {
  from: SelectedIdentityType;
  to: SelectedIdentityType;
  amount: number;
  token: Token;
  status?: TypeOptions;
}) {
  return (
    <Box
      minWidth={300}
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-evenly">
      {from.type === 'profile'
        ? from.identity.profile && <ProfileSection profile={from.identity.profile} />
        : from.identity.address && <AddressSection identity={from.identity} />}
      <Stack mx={1} width={75} alignItems="center" justifyContent="center">
        <Typography variant="subtitle2" fontWeight="bold">
          {normalizeNumberPrecision(amount)} {token.id.toUpperCase()}
        </Typography>
        {status === 'error' ? <Close /> : <ArrowForward />}
      </Stack>
      {to.type === 'profile'
        ? to.identity.profile && <ProfileSection profile={to.identity.profile} />
        : to.identity.address && <AddressSection identity={to.identity} />}
    </Box>
  );
}
