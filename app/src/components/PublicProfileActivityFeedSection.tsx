import {
  Avatar,
  Box,
  BoxProps,
  Chip,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { formatEther } from 'viem';
import { useContext } from 'react';
import { AnonymousUserContext } from '../contexts/UserContext';
import { TxInfo } from '../types/ActivityFetchResultType';
import NetworkAvatar from './NetworkAvatar';
import { getNetworkDisplayName } from '../utils/networks';
import { shortenWalletAddressLabel } from '../utils/address';

import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import ProfileAvatar from './ProfileAvatar';
import AddressAvatar from './AddressAvatar';
import { lightGreen, red } from '@mui/material/colors';
import { useEnsAvatar, useEnsName } from 'wagmi';

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

// TODO: add meta information when sent between flows (addresses will be different, but avatar indicator same)

function getActivityLabel(activity: string) {
  return activity === 'self' ? 'self' : 'paid';
}

export default function PublicProfileActivityFeedSection(props: BoxProps & { txInfo: TxInfo }) {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { ethUsdPrice } = useContext(AnonymousUserContext);
  const { txInfo } = props;

  const { data: ensNameFrom } = useEnsName({
    enabled: !txInfo.fromProfile,
    address: txInfo.from,
    chainId: 1,
    cacheTime: 300_000
  });

  const { data: ensNameTo } = useEnsName({
    enabled: !txInfo.toProfile,
    address: txInfo.to,
    chainId: 1,
    cacheTime: 300_000
  });

  const avatarFrom = useEnsAvatar({
    enabled: !txInfo.fromProfile,
    name: ensNameFrom,
    chainId: 1,
    cacheTime: 300_000
  });

  const avatarTo = useEnsAvatar({
    enabled: !txInfo.toProfile,
    name: ensNameTo,
    chainId: 1,
    cacheTime: 300_000
  });

  return (
    <Stack
      p={1}
      pl={2}
      direction="row"
      spacing={0.5}
      sx={{ border: 1, borderRadius: 5, borderColor: 'divider' }}>
      {txInfo.fromProfile ? (
        <ProfileAvatar profile={txInfo.fromProfile} />
      ) : avatarFrom.data ? (
        <Avatar src={avatarFrom.data} />
      ) : (
        <AddressAvatar address={txInfo.from} />
      )}
      <Stack spacing={0.5} width="100%">
        <Stack spacing={0.5} direction="row" alignItems="center">
          {txInfo.fromProfile ? (
            <Typography variant="caption" fontSize={smallScreen ? 13 : 15}>
              <b>{txInfo.fromProfile.displayName}</b> @{txInfo.fromProfile.username}
            </Typography>
          ) : (
            <Typography variant="caption" fontSize={smallScreen ? 13 : 15}>
              <b>{ensNameFrom ? ensNameFrom : shortenWalletAddressLabel(txInfo.from)}</b>
            </Typography>
          )}
          <Typography noWrap variant="caption" fontSize={smallScreen ? 13 : 15}>
            •
          </Typography>
          <Typography noWrap variant="caption" fontSize={smallScreen ? 13 : 15}>
            {timeAgo.format(new Date(txInfo.timestamp), 'round')}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="caption" fontSize={smallScreen ? 12 : 14}>
            {getActivityLabel(txInfo.activity)}
          </Typography>
          {txInfo.toProfile ? (
            <ProfileAvatar profile={txInfo.toProfile} sx={{ width: 25, height: 25 }} />
          ) : avatarTo.data ? (
            <Avatar src={avatarTo.data} />
          ) : (
            <AddressAvatar address={txInfo.to} scale={3} sx={{ width: 25, height: 25 }} />
          )}
          {txInfo.toProfile ? (
            <Typography variant="caption" fontSize={smallScreen ? 12 : 14}>
              <b>{txInfo.toProfile.displayName}</b> @{txInfo.toProfile.username}
            </Typography>
          ) : (
            <Typography variant="caption" fontSize={smallScreen ? 12 : 14}>
              <b>{ensNameTo ? ensNameTo : shortenWalletAddressLabel(txInfo.to)}</b>
            </Typography>
          )}
        </Stack>
        <Box display="flex" flexDirection="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="caption" fontSize={smallScreen ? 12 : 14}>
              on {getNetworkDisplayName(txInfo.chainId)}
            </Typography>
            <NetworkAvatar
              network={txInfo.chainId}
              sx={{
                width: 15,
                height: 15
              }}
            />
          </Stack>

          <Box
            display="flex"
            flexDirection="row"
            justifyContent="center"
            sx={{ minWidth: 80, maxWidth: 200 }}>
            <Chip
              size="medium"
              label={
                (txInfo.activity !== 'self' ? (txInfo.activity === 'inbound' ? '+' : '-') : '') +
                ('$' +
                  (parseFloat(formatEther(BigInt(txInfo.value ?? 0))) * (ethUsdPrice ?? 0)).toFixed(
                    1
                  ))
              }
              sx={{
                border: txInfo.activity === 'self' ? 0.5 : 0,
                minWidth: 60,
                alignSelf: 'center',
                fontSize: smallScreen ? 12 : 14,
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
      </Stack>
    </Stack>
  );
}
