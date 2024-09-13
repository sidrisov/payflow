import { Avatar, Box, BoxProps, IconButton, Link, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { PaymentType } from '../types/PaymentType';
import NetworkAvatar from './avatars/NetworkAvatar';
import { getNetworkDefaultBlockExplorerUrl, getNetworkDisplayName } from '../utils/networks';

import AddressAvatar from './avatars/AddressAvatar';
import { useEnsAvatar, useEnsName } from 'wagmi';
import ProfileAvatar from './avatars/ProfileAvatar';
import { AddressOrEnsWithLink } from './AddressOrEnsWithLink';
import { ProfileDisplayNameWithLink } from './ProfileDisplayNameWithLink';
import { PublicProfileDetailsPopover } from './menu/PublicProfileDetailsPopover';
import { IdentityType, ProfileType } from '../types/ProfileType';
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
function getActivityLabel(payment: PaymentType) {
  return payment.senderAddress === payment.receiverAddress ? 'paid self' : 'paid';
}

const ActivityIcon = ({ identity, payment }: { identity: IdentityType; payment: PaymentType }) => {
  const activity =
    payment.senderAddress === payment.receiverAddress
      ? 'self'
      : payment.sender?.identity === identity.address
      ? 'outbound'
      : 'inbound';

  switch (activity) {
    case 'self':
      return <SwapHoriz color="action" />;
    case 'inbound':
      return <ArrowDownwardIcon color="success" />;
    default:
      return <ArrowUpwardIcon color="error" />;
  }
};

const getActivityColor = (identity: IdentityType, payment: PaymentType) => {
  const activity =
    payment.senderAddress === payment.receiverAddress
      ? 'self'
      : payment.sender?.identity === identity.address
      ? 'outbound'
      : 'inbound';

  switch (activity) {
    case 'self':
      return 'text.primary';
    case 'inbound':
      return 'success.main';
    default:
      return 'error.main';
  }
};

export default function PublicProfileActivityFeedSection(
  props: BoxProps & { identity: IdentityType; payment: PaymentType }
) {
  const isMobile = useMobile();

  const { data: tokenPrices } = useTokenPrices();
  const { identity, payment } = props;

  const [profileDetailsPopoverAnchorEl, setProfileDetailsPopoverAnchorEl] =
    useState<null | HTMLElement>(null);
  const [popoverProfile, setPopOverProfile] = useState<ProfileType>();

  const [openPaymentMenu, setOpenPaymentMenu] = useState(false);
  const [paymentMenuAnchorEl, setPaymentMenuAnchorEl] = useState<null | HTMLElement>(null);

  const defultBlockExplorerUrl = getNetworkDefaultBlockExplorerUrl(payment.chainId);

  const { data: ensNameFrom } = useEnsName({
    address: payment.senderAddress as `0x${string}`,
    chainId: 1,
    query: {
      enabled: !payment.sender,
      staleTime: 300_000
    }
  });

  const { data: ensNameTo } = useEnsName({
    address: payment.receiverAddress as `0x${string}`,
    chainId: 1,
    query: {
      enabled: !payment.receiver,
      staleTime: 300_000
    }
  });

  const avatarFrom = useEnsAvatar({
    name: ensNameFrom as string,
    chainId: 1,
    query: {
      enabled: !payment.sender,
      staleTime: 300_000
    }
  });

  const avatarTo = useEnsAvatar({
    name: ensNameTo as string,
    chainId: 1,
    query: {
      enabled: !payment.receiver,
      staleTime: 300_000
    }
  });

  const token = ERC20_CONTRACTS.find(
    (t) => t.chainId === payment.chainId && t.id === payment.token
  ) as Token;

  const value = parseFloat(payment.tokenAmount?.toString() || '0');
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
        {payment.sender ? (
          <ProfileAvatar profile={payment.sender} />
        ) : avatarFrom.data ? (
          <Avatar src={avatarFrom.data} />
        ) : (
          <AddressAvatar address={payment.senderAddress} />
        )}
        <Stack spacing={0.5} width="100%">
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            {payment.sender ? (
              <ProfileDisplayNameWithLink
                profile={payment.sender}
                aria-owns={popoverProfile ? 'public-profile-popover' : undefined}
                onMouseEnter={(event) => {
                  setProfileDetailsPopoverAnchorEl(event.currentTarget);
                  setPopOverProfile(payment.sender);
                }}
                onMouseLeave={() => {
                  setProfileDetailsPopoverAnchorEl(null);
                  setPopOverProfile(undefined);
                }}
              />
            ) : (
              <AddressOrEnsWithLink
                address={payment.senderAddress}
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
              {getActivityLabel(payment)}
            </Typography>
            {payment.receiver ? (
              <ProfileAvatar profile={payment.receiver} sx={{ width: 25, height: 25 }} />
            ) : avatarTo.data ? (
              <Avatar src={avatarTo.data} sx={{ width: 25, height: 25 }} />
            ) : (
              <AddressAvatar
                address={payment.receiverAddress}
                scale={3}
                sx={{ width: 25, height: 25 }}
              />
            )}
            {payment.receiver ? (
              <ProfileDisplayNameWithLink
                profile={payment.receiver}
                aria-owns={popoverProfile ? 'public-profile-popover' : undefined}
                onMouseEnter={(event) => {
                  setProfileDetailsPopoverAnchorEl(event.currentTarget);
                  setPopOverProfile(payment.receiver);
                }}
                onMouseLeave={() => {
                  setProfileDetailsPopoverAnchorEl(null);
                  setPopOverProfile(undefined);
                }}
              />
            ) : (
              <AddressOrEnsWithLink
                address={payment.receiverAddress}
                blockExplorerUrl={defultBlockExplorerUrl}
                ens={ensNameTo ?? undefined}
              />
            )}
          </Stack>
          <Link
            href={`${defultBlockExplorerUrl}/tx/${payment.hash}`}
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
                on <b>{getNetworkDisplayName(payment.chainId)}</b>
              </Typography>
              <NetworkAvatar
                chainId={payment.chainId}
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
            justifyContent={payment.comment ? 'space-between' : 'flex-end'}>
            {payment.comment && (
              <Typography
                variant="caption"
                fontWeight="bold"
                fontSize={isMobile ? 12 : 14}
                maxWidth={200}>
                💬 {payment.comment}
              </Typography>
            )}
            <Box
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="flex-end"
              ml="auto">
              <ActivityIcon identity={identity} payment={payment} />
              <Typography
                variant="caption"
                fontWeight="bold"
                fontSize={isMobile ? 12 : 14}
                color={getActivityColor(identity, payment)}>
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
          payment={payment}
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
