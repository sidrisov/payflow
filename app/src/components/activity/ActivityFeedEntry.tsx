import { useState } from 'react';
import { Box, BoxProps, IconButton, Stack, Typography } from '@mui/material';
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

  const activityType = getActivityType(identity, payment);

  const { ensName: ensNameFrom, ensAvatar: avatarFrom } = useEnsData(payment.senderAddress);
  const { ensName: ensNameTo, ensAvatar: avatarTo } = useEnsData(payment.receiverAddress);

  const { social: receiverSocial } = useSocialData(
    payment.receiverFid?.toString(),
    payment.receiverAddress
  );

  return (
    <>
      <Stack
        m={1}
        p={2}
        direction="row"
        spacing={0.5}
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
            <UserDisplayName
              profile={payment.sender}
              address={payment.senderAddress}
              ens={ensNameFrom ?? undefined}
              onMouseEnter={(event) => {
                setProfileDetailsPopoverAnchorEl(event.currentTarget);
                setPopOverProfile(payment.sender);
              }}
              onMouseLeave={() => {
                setProfileDetailsPopoverAnchorEl(null);
                setPopOverProfile(undefined);
              }}
            />

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

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="caption" fontSize={isMobile ? 12 : 14}>
              {getActivityName(identity, payment)}
            </Typography>
            {activityType !== 'self' && (
              <>
                <UserAvatar
                  profile={payment.receiver}
                  address={payment.receiverAddress}
                  ensAvatar={avatarTo}
                  social={receiverSocial ?? undefined}
                  sx={{ width: 25, height: 25 }}
                />
                <UserDisplayName
                  profile={payment.receiver}
                  address={payment.receiverAddress}
                  ens={ensNameTo ?? undefined}
                  social={receiverSocial ?? undefined}
                  onMouseEnter={(event) => {
                    setProfileDetailsPopoverAnchorEl(event.currentTarget);
                    setPopOverProfile(payment.receiver);
                  }}
                  onMouseLeave={() => {
                    setProfileDetailsPopoverAnchorEl(null);
                    setPopOverProfile(undefined);
                  }}
                />
              </>
            )}
          </Stack>

          <PaymentDetails payment={payment} identity={identity} />

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
