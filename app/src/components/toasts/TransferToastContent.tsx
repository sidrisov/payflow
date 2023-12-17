import { Typography, Stack, Box } from '@mui/material';
import { ArrowForward, Close } from '@mui/icons-material';
import { TypeOptions } from 'react-toastify';
import { formatEther } from 'viem';
import { SelectedProfileWithSocialsType } from '../../types/ProfleType';
import { ProfileSection } from '../ProfileSection';
import { AddressSection } from '../AddressSection';

export function TransferToastContent({
  from,
  to,
  ethAmount,
  ethUsdPrice,
  status
}: {
  from: SelectedProfileWithSocialsType;
  to: SelectedProfileWithSocialsType;
  ethAmount: bigint;
  ethUsdPrice: number | undefined;
  status?: TypeOptions;
}) {
  return (
    <Box display="flex" flexDirection="row" alignItems="center" justifyContent="space-between">
      {from.type === 'profile'
        ? from.data.profile && <ProfileSection maxWidth={150} profile={from.data.profile} />
        : from.data.meta && <AddressSection maxWidth={150} meta={from.data.meta} />}
      <Stack alignItems="center" justifyContent="center">
        <Typography variant="subtitle2">
          ${(parseFloat(formatEther(ethAmount)) * (ethUsdPrice ?? 0)).toPrecision(3)}
        </Typography>
        {status === 'error' ? <Close /> : <ArrowForward />}
      </Stack>
      {to.type === 'profile'
        ? to.data.profile && <ProfileSection maxWidth={150} profile={to.data.profile} />
        : to.data.meta && <AddressSection maxWidth={150} meta={to.data.meta} />}
    </Box>
  );
}
