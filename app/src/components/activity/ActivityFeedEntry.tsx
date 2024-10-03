import { useState, useEffect } from 'react';
import { Box, BoxProps, IconButton, Stack, Typography, Skeleton } from '@mui/material';
import { MoreHoriz } from '@mui/icons-material';

import { PaymentType } from '../../types/PaymentType';
import { IdentityType, ProfileType } from '../../types/ProfileType';

import { useEnsData } from '../../utils/hooks/useEnsData';
import { useMobile } from '../../utils/hooks/useMobile';
import { useSocialData } from '../../utils/hooks/useSocials';

import { PublicProfileDetailsPopover } from '../menu/PublicProfileDetailsPopover';
import { PaymentMenu } from '../menu/PaymentMenu';
import { CommentBubble } from './CommentBubble';
import { PaymentDetails } from './PaymentDetails';
import { UserAvatar } from './UserAvatar';
import { UserDisplayName } from './UserDisplayName';
import { getActivityName, getActivityType } from './ActivityIcon';

export default function PublicProfileActivityFeedSection(
  props: BoxProps & { identity: IdentityType; payment: PaymentType }
) {
  const isMobile = useMobile();
  const { identity, payment } = props;

  const [profileDetailsPopoverAnchorEl, setProfileDetailsPopoverAnchorEl] =
    useState<null | HTMLElement>(null);
  const [popoverProfile, setPopOverProfile] = useState<ProfileType>();

  const [openPaymentMenu, setOpenPaymentMenu] = useState(false);
  const [paymentMenuAnchorEl, setPaymentMenuAnchorEl] = useState<null | HTMLElement>(null);

  const { ensName: ensNameFrom, ensAvatar: avatarFrom } = useEnsData(payment.senderAddress);
  const { ensName: ensNameTo, ensAvatar: avatarTo } = useEnsData(payment.receiverAddress);

  const { social: senderSocial, isLoading: isLoadingSenderSocial } = useSocialData(
    undefined,
    payment.senderAddress ?? payment.sender?.identity
  );

  const { social: receiverSocial, isLoading: isLoadingReceiverSocial } = useSocialData(
    payment.receiverFid?.toString(),
    payment.receiverAddress ?? payment.receiver?.identity
  );

  if (isLoadingSenderSocial || isLoadingReceiverSocial) {
    return (
      <Stack
        m={1}
        p={2}
        direction="row"
        spacing={1}
        alignItems="flex-start"
        sx={{ border: 1, borderRadius: 5, borderColor: 'divider' }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ flexShrink: 0 }} />
        <Stack spacing={0.5} width="100%">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" height={30} />
        </Stack>
      </Stack>
    );
  }

  // Add error handling
  if (!payment.senderAddress && !payment.sender?.identity) {
    console.error('Missing sender information');
    return (
      <Typography fontSize={12} textAlign="center" color="error">
        Error: Missing sender information
      </Typography>
    );
  }

  if (!payment.receiverAddress && !payment.receiver?.identity && !payment.receiverFid) {
    console.error('Missing receiver information');
    return (
      <Typography fontSize={12} textAlign="center" color="error">
        Error: Missing receiver information
      </Typography>
    );
  }

  const activityType = getActivityType(
    identity,
    payment,
    senderSocial ?? undefined,
    receiverSocial ?? undefined
  );

  return (
    <>
      <Stack
        m={1}
        p={2}
        direction="row"
        spacing={1}
        sx={{ border: 1, borderRadius: 5, borderColor: 'divider' }}>
        <UserAvatar
          profile={payment.sender}
          address={payment.senderAddress}
          ensAvatar={avatarFrom}
        />
        <Stack spacing={0.5} width="100%">
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            <Stack direction="row" justifyContent="flex-start" alignItems="flex-end" spacing={0.5}>
              <UserDisplayName
                profile={payment.sender}
                address={payment.senderAddress}
                ens={ensNameFrom ?? undefined}
                /*               onMouseEnter={(event) => {
                setProfileDetailsPopoverAnchorEl(event.currentTarget);
                setPopOverProfile(payment.sender);
              }}
              onMouseLeave={() => {
                setProfileDetailsPopoverAnchorEl(null);
                setPopOverProfile(undefined);
              }} */
              />

              <Typography variant="caption" fontSize={isMobile ? 12 : 14}>
                {getActivityName(activityType, payment)}
              </Typography>
              {activityType !== 'self' && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <UserAvatar
                    profile={payment.receiver}
                    address={payment.receiverAddress}
                    ensAvatar={avatarTo}
                    social={receiverSocial ?? undefined}
                    sx={{ width: 20, height: 20 }}
                  />
                  <UserDisplayName
                    profile={payment.receiver}
                    address={payment.receiverAddress}
                    ens={ensNameTo ?? undefined}
                    social={receiverSocial ?? undefined}
                    /* onMouseEnter={(event) => {
                    setProfileDetailsPopoverAnchorEl(event.currentTarget);
                    setPopOverProfile(payment.receiver);
                  }}
                  onMouseLeave={() => {
                    setProfileDetailsPopoverAnchorEl(null);
                    setPopOverProfile(undefined);
                  }} */
                  />
                </Stack>
              )}
            </Stack>

            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setPaymentMenuAnchorEl(event.currentTarget);
                setOpenPaymentMenu(true);
              }}>
              <MoreHoriz fontSize="small" />
            </IconButton>
          </Box>

          <PaymentDetails activity={activityType} payment={payment} />

          {payment.comment && <CommentBubble comment={payment.comment} />}
        </Stack>
      </Stack>
      {popoverProfile !== undefined && (
        <PublicProfileDetailsPopover
          open={popoverProfile !== undefined}
          onClose={() => setPopOverProfile(undefined)}
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
