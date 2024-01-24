import { Typography, Stack, Box } from '@mui/material';
import { ArrowForward, Close } from '@mui/icons-material';
import { TypeOptions } from 'react-toastify';
import { formatEther } from 'viem';
import { SelectedIdentityType } from '../../types/ProfleType';
import { ProfileSection } from '../ProfileSection';
import { AddressSection } from '../AddressSection';

export function TransferToastContent({
  from,
  to,
  ethAmount,
  ethUsdPrice,
  status
}: {
  from: SelectedIdentityType;
  to: SelectedIdentityType;
  ethAmount: bigint;
  ethUsdPrice: number | undefined;
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
        : from.identity.meta && <AddressSection identity={from.identity} />}
      <Stack mx={1} width={50} alignItems="center" justifyContent="center">
        <Typography noWrap variant="subtitle2">
          ${(parseFloat(formatEther(ethAmount)) * (ethUsdPrice ?? 0)).toPrecision(3)}
        </Typography>
        {status === 'error' ? <Close /> : <ArrowForward />}
      </Stack>
      {to.type === 'profile'
        ? to.identity.profile && <ProfileSection profile={to.identity.profile} />
        : to.identity.meta && <AddressSection identity={to.identity} />}
    </Box>
  );
}
