import { Avatar, Box, BoxProps, IconButton, Link, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { TxInfo } from '../types/ActivityFetchResultType';
import NetworkAvatar from './avatars/NetworkAvatar';
import { getNetworkDefaultBlockExplorerUrl, getNetworkDisplayName } from '../utils/networks';

import AddressAvatar from './avatars/AddressAvatar';
import { useEnsAvatar, useEnsName } from 'wagmi';
import ProfileAvatar from './avatars/ProfileAvatar';
import { AddressOrEnsWithLink } from './AddressOrEnsWithLink';
import { ProfileDisplayNameWithLink } from './ProfileDisplayNameWithLink';
import { PublicProfileDetailsPopover } from './menu/PublicProfileDetailsPopover';
import { ProfileType } from '../types/ProfileType';
import { ERC20_CONTRACTS, Token } from '../utils/erc20contracts';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../utils/formats';
import TokenAvatar from './avatars/TokenAvatar';
import { useTokenPrices } from '../utils/queries/prices';
import { useMobile } from '../utils/hooks/useMobile';
import { PaymentMenu } from './menu/PaymentMenu';
import { MoreHoriz } from '@mui/icons-material';
import { SwapHoriz } from '@mui/icons-material';
import ArrowUpwardIcon from '@mui/icons-material/NorthEast';
import ArrowDownwardIcon from '@mui/icons-material/SouthEast';

// TODO: add meta information when sent between flows (addresses will be different, but avatar indicator same)
function getActivityLabel(activity: string) {
  return activity === 'self' ? 'paid self' : 'paid';
}

const ActivityIcon = ({ activity }: { activity: string }) => {
  switch (activity) {
    case 'self':
      return <SwapHoriz color="action" />;
    case 'inbound':
      return <ArrowDownwardIcon color="success" />;
    default:
      return <ArrowUpwardIcon color="error" />;
  }
};

const getActivityColor = (activity: string) => {
  switch (activity) {
    case 'self':
      return 'text.primary';
    case 'inbound':
      return 'success.main';
    default:
      return 'error.main';
  }
};

export default function PublicProfileActivityFeedSection(props: BoxProps & { txInfo: TxInfo }) {
  const isMobile = useMobile();

  const { data: tokenPrices } = useTokenPrices();
  const { txInfo } = props;

  const [profileDetailsPopoverAnchorEl, setProfileDetailsPopoverAnchorEl] =
    useState<null | HTMLElement>(null);
  const [popoverProfile, setPopOverProfile] = useState<ProfileType>();

  const [openPaymentMenu, setOpenPaymentMenu] = useState(false);
  const [paymentMenuAnchorEl, setPaymentMenuAnchorEl] = useState<null | HTMLElement>(null);

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

  const token = ERC20_CONTRACTS.find(
    (t) => t.chainId === txInfo.chainId && t.id === txInfo.token?.symbol
  ) as Token;

  const value = parseFloat(txInfo.value?.toString() || '0');
  const price = tokenPrices ? tokenPrices[token.id] : 0;

  const formattedAmount = `$${normalizeNumberPrecision(value * price)}`;

  return (
    <>
      <Stack
        m={1}
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

            <IconButton
              size="small"
              onClick={async (event) => {
                event.stopPropagation();
                setPaymentMenuAnchorEl(event.currentTarget);
                setOpenPaymentMenu(true);
              }}>
              <MoreHoriz fontSize="small" />
            </IconButton>
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
                {formatAmountWithSuffix(normalizeNumberPrecision(value))} {token.name}
              </Typography>
              <TokenAvatar
                token={token}
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
            <Box
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="flex-end"
              ml="auto">
              <ActivityIcon activity={txInfo.activity} />
              <Typography
                variant="caption"
                fontWeight="bold"
                fontSize={isMobile ? 12 : 14}
                color={getActivityColor(txInfo.activity)}>
                {formattedAmount}
              </Typography>
            </Box>
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
      {openPaymentMenu && (
        <PaymentMenu
          open={openPaymentMenu}
          payment={txInfo.payment!}
          anchorEl={paymentMenuAnchorEl}
          onClose={() => {
            setOpenPaymentMenu(false);
          }}
          onClick={() => {
            setOpenPaymentMenu(false);
          }}
        />
      )}
    </>
  );
}
