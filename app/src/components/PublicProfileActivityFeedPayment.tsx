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
import { useState } from 'react';
import { TxInfo, TxToken } from '../types/ActivityFetchResultType';
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
import { DEGEN_TOKEN, ETH_TOKEN } from '../utils/erc20contracts';
import { normalizeNumberPrecision } from '../utils/normalizeNumberPrecision';
import TokenAvatar from './avatars/TokenAvatar';
import { useTokenPrices } from '../utils/queries/prices';
import { degen } from 'viem/chains';

// TODO: add meta information when sent between flows (addresses will be different, but avatar indicator same)
function getActivityLabel(activity: string) {
  return activity === 'self' ? 'paid self' : 'paid';
}

export default function PublicProfileActivityFeedSection(props: BoxProps & { txInfo: TxInfo }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: tokenPrices } = useTokenPrices();
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

  const token =
    txInfo.token ?? txInfo.chainId === degen.id
      ? { name: 'Degen', decimals: 18, symbol: DEGEN_TOKEN }
      : { name: 'Ether', decimals: 18, symbol: ETH_TOKEN };

  const value = parseFloat(formatUnits(BigInt(txInfo.value ?? 0), token.decimals));
  const price = tokenPrices ? tokenPrices[token.symbol] : 0;

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
                  aria-owns={popoverProfile ? 'public-profile-popover' : undefined}
                  onMouseEnter={(event) => {
                    setProfileDetailsPopoverAnchorEl(event.currentTarget);
                    setPopOverProfile(txInfo.fromProfile);
                  }}
                  onMouseLeave={() => {
                    setProfileDetailsPopoverAnchorEl(null);
                    setPopOverProfile(undefined);
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
                {timeAgo.format(new Date(txInfo.timestamp), 'mini')}
              </Typography>
            </Stack>

            {txInfo.payment && txInfo.payment.source && (
              <Chip
                variant="outlined"
                size="medium"
                clickable
                label={txInfo.payment.source.app}
                avatar={<Avatar src={`/dapps/${txInfo.payment.source.app.toLowerCase()}.png`} />}
                {...(txInfo.payment.source.ref && {
                  component: 'a',
                  href: txInfo.payment.source.ref,
                  target: '_blank'
                })}
                sx={{ fontWeight: 'bold', border: 0 }}
              />
            )}
          </Box>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="caption" fontSize={isMobile ? 12 : 14}>
              {getActivityLabel(txInfo.activity)}
            </Typography>
            {txInfo.toProfile ? (
              <ProfileAvatar profile={txInfo.toProfile} sx={{ width: 25, height: 25 }} />
            ) : avatarTo.data ? (
              <Avatar src={avatarTo.data} sx={{ width: 25, height: 25 }} />
            ) : (
              <AddressAvatar address={txInfo.to} scale={3} sx={{ width: 25, height: 25 }} />
            )}
            {txInfo.toProfile ? (
              <ProfileDisplayNameWithLink
                profile={txInfo.toProfile}
                aria-owns={popoverProfile ? 'public-profile-popover' : undefined}
                onMouseEnter={(event) => {
                  setProfileDetailsPopoverAnchorEl(event.currentTarget);
                  setPopOverProfile(txInfo.toProfile);
                }}
                onMouseLeave={() => {
                  setProfileDetailsPopoverAnchorEl(null);
                  setPopOverProfile(undefined);
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
          <Link
            href={`${defultBlockExplorerUrl}/tx/${txInfo.hash}`}
            target="_blank"
            underline="hover"
            color="inherit"
            overflow="clip"
            textOverflow="ellipsis">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
                {normalizeNumberPrecision(value) + ' ' + token.name}
              </Typography>
              <TokenAvatar
                tokenName={token.symbol}
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

          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent={
              txInfo.payment && txInfo.payment.comment ? 'space-between' : 'flex-end'
            }>
            {txInfo.payment && txInfo.payment.comment && (
              <Typography
                variant="caption"
                fontWeight="bold"
                fontSize={isMobile ? 12 : 14}
                maxWidth={200}>
                💬 {txInfo.payment.comment}
              </Typography>
            )}
            <Chip
              size="medium"
              label={
                (txInfo.activity !== 'self' ? (txInfo.activity === 'inbound' ? '+' : '-') : '') +
                ('$' + normalizeNumberPrecision(value * price))
              }
              sx={{
                minWidth: 60,
                border: txInfo.activity === 'self' ? 0.5 : 0,
                alignSelf: 'center',
                fontSize: isMobile ? 12 : 14,
                fontWeight: 'bold',
                color:
                  txInfo.activity === 'self'
                    ? 'inherit'
                    : txInfo.activity === 'inbound'
                    ? 'black'
                    : 'white',
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
