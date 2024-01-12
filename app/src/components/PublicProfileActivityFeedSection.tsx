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
import { useContext, useState } from 'react';
import { AnonymousUserContext } from '../contexts/UserContext';
import { TxInfo } from '../types/ActivityFetchResultType';
import NetworkAvatar from './NetworkAvatar';
import { getNetworkDefaultBlockExplorerUrl, getNetworkDisplayName } from '../utils/networks';

import AddressAvatar from './AddressAvatar';
import { lightGreen, red } from '@mui/material/colors';
import { useEnsAvatar, useEnsName } from 'wagmi';
import { timeAgo } from '../utils/time';
import ProfileAvatar from './ProfileAvatar';
import { AddressOrEnsWithLink } from './AddressOrEnsWithLink';
import { ProfileDisplayNameWithLink } from './ProfileDisplayNameWithLink';
import { PublicProfileDetailsPopover } from './PublicProfileDetailsPopover';
import { ProfileType } from '../types/ProfleType';

// TODO: add meta information when sent between flows (addresses will be different, but avatar indicator same)

function getActivityLabel(activity: string) {
  return activity === 'self' ? 'paid self' : 'paid';
}

export default function PublicProfileActivityFeedSection(props: BoxProps & { txInfo: TxInfo }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { ethUsdPrice } = useContext(AnonymousUserContext);
  const { txInfo } = props;

  const [profileDetailsPopoverAnchorEl, setProfileDetailsPopoverAnchorEl] =
    useState<null | HTMLElement>(null);
  const [popoverProfile, setPopOverProfile] = useState<ProfileType>();

  const defultBlockExplorerUrl = getNetworkDefaultBlockExplorerUrl(txInfo.chainId);

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
    <>
      <Stack
        p={2}
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
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            <Stack spacing={0.5} direction="row" alignItems="center">
              {txInfo.fromProfile ? (
                <ProfileDisplayNameWithLink
                  profile={txInfo.fromProfile}
                  onMouseOverCapture={(event) => {
                    setProfileDetailsPopoverAnchorEl(event.currentTarget);
                    setPopOverProfile(txInfo.fromProfile);
                  }}
                />
              ) : (
                <AddressOrEnsWithLink
                  address={txInfo.from}
                  blockExplorerUrl={defultBlockExplorerUrl}
                  ens={ensNameFrom ?? undefined}
                />
              )}
              <Typography variant="caption" fontSize={isMobile ? 13 : 15}>
                •
              </Typography>
              <Typography noWrap variant="caption" fontSize={isMobile ? 13 : 15}>
                {timeAgo.format(new Date(txInfo.timestamp), isMobile ? 'mini' : 'round')}
              </Typography>
            </Stack>
            {/* <Tooltip title="Transaction details">
            <IconButton
              href={`${defultBlockExplorerUrl}/tx/${txInfo.hash}`}
              target="_blank"
              size="small"
              color="inherit">
              <MoreHoriz fontSize="small" />
            </IconButton>
          </Tooltip> */}
          </Box>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="caption" fontSize={isMobile ? 12 : 14}>
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
              <ProfileDisplayNameWithLink
                profile={txInfo.toProfile}
                onMouseOverCapture={(event) => {
                  setProfileDetailsPopoverAnchorEl(event.currentTarget);
                  setPopOverProfile(txInfo.toProfile);
                }}
              />
            ) : (
              <AddressOrEnsWithLink
                address={txInfo.to}
                blockExplorerUrl={defultBlockExplorerUrl}
                ens={ensNameTo ?? undefined}
              />
            )}
          </Stack>
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" fontSize={isMobile ? 12 : 14}>
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
                minWidth: 60,
                border: txInfo.activity === 'self' ? 0.5 : 0,
                alignSelf: 'center',
                fontSize: isMobile ? 12 : 14,
                bgcolor:
                  txInfo.activity === 'self'
                    ? 'inherit'
                    : txInfo.activity === 'inbound'
                    ? lightGreen.A700
                    : red.A400
              }}
            />
          </Box>
        </Stack>
      </Stack>
      {popoverProfile !== undefined && (
        <PublicProfileDetailsPopover
          open={popoverProfile !== undefined}
          onClose={async () => setPopOverProfile(undefined)}
          anchorEl={profileDetailsPopoverAnchorEl}
          profile={popoverProfile}
        />
      )}
    </>
  );
}
