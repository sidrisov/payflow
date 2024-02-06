import {
  Avatar,
  Box,
  BoxProps,
  Chip,
  Link,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { formatUnits } from 'viem';
import { useContext, useState } from 'react';
import { ProfileContext } from '../contexts/UserContext';
import { TxInfo } from '../types/ActivityFetchResultType';
import NetworkAvatar from './avatars/NetworkAvatar';
import { getNetworkDefaultBlockExplorerUrl, getNetworkDisplayName } from '../utils/networks';

import AddressAvatar from './avatars/AddressAvatar';
import { lightGreen, red } from '@mui/material/colors';
import { useEnsAvatar, useEnsName } from 'wagmi';
import { timeAgo } from '../utils/time';
import ProfileAvatar from './avatars/ProfileAvatar';
import { AddressOrEnsWithLink } from './AddressOrEnsWithLink';
import { ProfileDisplayNameWithLink } from './ProfileDisplayNameWithLink';
import { PublicProfileDetailsPopover } from './menu/PublicProfileDetailsPopover';
import { ProfileType } from '../types/ProfleType';
import { ETH_TOKEN } from '../utils/erc20contracts';
import { normalizeNumberPrecision } from '../utils/normalizeNumberPrecision';
import TokenAvatar from './avatars/TokenAvatar';

// TODO: add meta information when sent between flows (addresses will be different, but avatar indicator same)

function getActivityLabel(activity: string) {
  return activity === 'self' ? 'paid self' : 'paid';
}

export default function PublicProfileActivityFeedSection(props: BoxProps & { txInfo: TxInfo }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { tokenPrices } = useContext(ProfileContext);
  const { txInfo } = props;

  const [profileDetailsPopoverAnchorEl, setProfileDetailsPopoverAnchorEl] =
    useState<null | HTMLElement>(null);
  const [popoverProfile, setPopOverProfile] = useState<ProfileType>();

  const defultBlockExplorerUrl = getNetworkDefaultBlockExplorerUrl(txInfo.chainId);

  const { data: ensNameFrom } = useEnsName({
    address: txInfo.from,
    chainId: 1,
    query: {
      enabled: !txInfo.fromProfile,
      staleTime: 300_000
    }
  });

  const { data: ensNameTo } = useEnsName({
    address: txInfo.to,
    chainId: 1,
    query: {
      enabled: !txInfo.toProfile,
      staleTime: 300_000
    }
  });

  const avatarFrom = useEnsAvatar({
    name: ensNameFrom as string,
    chainId: 1,
    query: {
      enabled: !txInfo.fromProfile,
      staleTime: 300_000
    }
  });

  const avatarTo = useEnsAvatar({
    name: ensNameTo as string,
    chainId: 1,
    query: {
      enabled: !txInfo.toProfile,
      staleTime: 300_000
    }
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
            <Link
              href={`${defultBlockExplorerUrl}/tx/${txInfo.hash}`}
              target="_blank"
              underline="hover"
              color="inherit"
              overflow="clip"
              textOverflow="ellipsis">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
                  {normalizeNumberPrecision(parseFloat(formatUnits(BigInt(txInfo.value ?? 0), 18)))}
                </Typography>
                <TokenAvatar
                  tokenName={ETH_TOKEN}
                  sx={{
                    width: 15,
                    height: 15
                  }}
                />
                <Typography variant="caption" fontSize={isMobile ? 12 : 14}>
                  on <b>{getNetworkDisplayName(txInfo.chainId)}</b>
                </Typography>
                <NetworkAvatar
                  chainId={txInfo.chainId}
                  sx={{
                    width: 15,
                    height: 15
                  }}
                />
              </Stack>
            </Link>

            <Chip
              size="medium"
              label={
                (txInfo.activity !== 'self' ? (txInfo.activity === 'inbound' ? '+' : '-') : '') +
                ('$' +
                  normalizeNumberPrecision(
                    parseFloat(formatUnits(BigInt(txInfo.value ?? 0), 18)) *
                      (tokenPrices ? tokenPrices[ETH_TOKEN] : 0)
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
