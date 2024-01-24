import { Repeat, ArrowDownward, Send } from '@mui/icons-material';
import {
  Badge,
  Box,
  BoxProps,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { lightGreen, red } from '@mui/material/colors';
import { formatEther } from 'viem';
import { IdentityType } from '../types/ProfleType';
import { useContext } from 'react';
import { ProfileContext } from '../contexts/UserContext';
import { TxInfo } from '../types/ActivityFetchResultType';
import NetworkAvatar from './NetworkAvatar';
import ProfileSectionButton from './ProfileSectionButton';
import AddressSectionButton from './AddressSectionButton';
import { getNetworkDefaultBlockExplorerUrl } from '../utils/networks';
import { timeAgo } from '../utils/time';

// TODO: add meta information when sent between flows (addresses will be different, but avatar indicator same)
function getActivityLabel(activity: string) {
  return activity === 'self' ? 'Self' : activity === 'inbound' ? 'Received' : 'Sent';
}

function getActivityIndicator(txInfo: TxInfo, blockExplorerUrl: string | undefined) {
  const { activity, hash } = txInfo;

  return (
    <Tooltip title="Tx details">
      <IconButton
        href={`${blockExplorerUrl}/tx/${hash}`}
        target="_blank"
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
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { ethUsdPrice } = useContext(ProfileContext);
  const { txInfo } = props;

  const blockExplorerUrl = getNetworkDefaultBlockExplorerUrl(txInfo.chainId);

  return (
    <Box
      px={smallScreen ? 0 : 0.5}
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between">
      <Stack direction="row" spacing={1} alignItems="center" width={110}>
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
          {getActivityIndicator(txInfo, blockExplorerUrl)}
        </Badge>

        <Stack alignItems="center" width={70}>
          <Typography variant="subtitle2" fontSize={smallScreen ? 13 : 16}>
            {getActivityLabel(txInfo.activity)}
          </Typography>
          <Typography noWrap variant="caption" fontSize={smallScreen ? 10 : 12}>
            {timeAgo.format(new Date(txInfo.timestamp), 'round')}
          </Typography>
        </Stack>
      </Stack>
      {(txInfo.activity === 'inbound' ? txInfo.fromProfile : txInfo.toProfile) ? (
        <ProfileSectionButton
          fullWidth
          profile={txInfo.activity === 'inbound' ? txInfo.fromProfile : txInfo.toProfile}
        />
      ) : (
        <AddressSectionButton
          fullWidth
          href={`${blockExplorerUrl}/address/${
            txInfo.activity === 'inbound' ? txInfo.from : txInfo.to
          }`}
          identity={
            {
              address: txInfo.activity === 'inbound' ? txInfo.from : txInfo.to
            } as IdentityType
          }
        />
      )}
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
