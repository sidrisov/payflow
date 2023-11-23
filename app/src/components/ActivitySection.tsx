import { Repeat, ArrowDownward, Send } from '@mui/icons-material';
import { Badge, Box, BoxProps, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { lightGreen, red } from '@mui/material/colors';
import { formatEther } from 'viem';
import { MetaType } from '../types/ProfleType';
import { AddressSection } from './AddressSection';
import { ProfileSection } from './ProfileSection';
import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { TxInfo } from '../types/ActivityFetchResultType';
import NetworkAvatar from './NetworkAvatar';
import { useNavigate } from 'react-router-dom';
import { getNetwork } from 'wagmi/actions';

// TODO: add meta information when sent between flows (addresses will be different, but avatar indicator same)

function getActivityLabel(activity: string) {
  return activity === 'self' ? 'Self' : activity === 'inbound' ? 'Received' : 'Sent';
}

function getActivityIndicator(txInfo: TxInfo) {
  const { activity, chainId, hash } = txInfo;

  const blockExplorerUrl = getNetwork().chains.find((c) => c.id === chainId)?.blockExplorers
    ?.etherscan?.url;

  const navigate = useNavigate();
  return (
    <Tooltip title="Tx details">
      <IconButton
        href={`${blockExplorerUrl}/tx/${hash}`}
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 1,
          borderStyle: 'dashed',
          borderRadius: 5
        }}>
        {activity === 'self' ? (
          <Repeat color="inherit" fontSize="small" />
        ) : activity === 'inbound' ? (
          <ArrowDownward fontSize="small" sx={{ color: lightGreen.A700 }} />
        ) : (
          <Send fontSize="small" sx={{ color: red.A400 }} />
        )}
      </IconButton>
    </Tooltip>
  );
}

export default function ActivitySection(props: BoxProps & { txInfo: TxInfo }) {
  const { ethUsdPrice } = useContext(UserContext);
  const { txInfo } = props;

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ p: 1, border: 0, borderRadius: 5 }}>
      <Stack direction="row" spacing={1} alignItems="center" width={140}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <NetworkAvatar
              network={txInfo.chainId}
              sx={{
                width: 15,
                height: 15
              }}
            />
          }>
          {getActivityIndicator(txInfo)}
        </Badge>

        <Stack alignItems="center">
          <Typography variant="subtitle2" fontSize={16}>
            {getActivityLabel(txInfo.activity)}
          </Typography>
          <Typography variant="caption">
            {new Date(txInfo.timestamp).toLocaleDateString()}
          </Typography>
        </Stack>
      </Stack>
      <Box display="flex" flexDirection="row" justifyContent="flex-start" width={140}>
        {txInfo.profile ? (
          <ProfileSection profile={txInfo.profile} />
        ) : (
          <AddressSection
            meta={
              {
                addresses: [txInfo.activity === 'inbound' ? txInfo.from : txInfo.to]
              } as MetaType
            }
          />
        )}
      </Box>
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="center"
        sx={{ minWidth: 100, maxWidth: 200 }}>
        <Chip
          size="medium"
          label={
            (txInfo.activity !== 'self' ? (txInfo.activity === 'inbound' ? '+' : '-') : '') +
            (' $' +
              (parseFloat(formatEther(BigInt(txInfo.value ?? 0))) * (ethUsdPrice ?? 0)).toFixed(1))
          }
          sx={{
            border: txInfo.activity === 'self' ? 0.5 : 0,
            minWidth: 60,
            alignSelf: 'center',
            bgcolor:
              txInfo.activity === 'self'
                ? 'inherit'
                : txInfo.activity === 'inbound'
                ? lightGreen.A700
                : red.A400
          }}
        />
      </Box>
    </Box>
  );
}