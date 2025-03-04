import React from 'react';
import { Popover, Box, Typography, Stack, Avatar } from '@mui/material';
import { grey } from '@mui/material/colors';
import { IdentityType } from '@payflow/common';
import FarcasterAvatar from '../avatars/FarcasterAvatar';
import LensAvatar from '../avatars/LensAvatar';
import { useDarkMode } from '../../utils/hooks/useDarkMode';

interface SocialLinksPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  identity: IdentityType;
  profile: any;
  address: string | undefined;
  view: 'profile' | 'address';
  tags?: string[];
}

export const SocialLinksPopover: React.FC<SocialLinksPopoverProps> = ({
  open,
  anchorEl,
  onClose,
  identity,
  profile,
  address,
  view,
  tags
}) => {
  const prefersDarkMode = useDarkMode();

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      sx={{
        zIndex: 1450,
        '& .MuiPaper-root': {
          borderRadius: 5
        }
      }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}>
      <Box p={1.5}>
        {profile?.identity || address ? (
          (profile?.identity ?? address) === identity.profile?.identity ? (
            <Typography variant="caption" fontWeight="bold">
              Your {view === 'profile' ? 'profile' : 'address'}
            </Typography>
          ) : identity?.meta?.insights?.farcasterFollow ||
            identity?.meta?.insights?.lensFollow ||
            identity?.meta?.insights?.sentTxs ||
            tags?.includes('hypersub') ||
            tags?.includes('paragraph') ||
            tags?.includes('alfafrens') ||
            tags?.includes('efp') ? (
            <>
              {identity.meta?.insights?.farcasterFollow && (
                <Stack spacing={1} direction="row" alignItems="center">
                  <FarcasterAvatar size={15} />
                  <Typography variant="caption" fontWeight="bold">
                    {identity.meta.insights.farcasterFollow === 'mutual'
                      ? 'Mutual follow'
                      : 'You follow them'}
                  </Typography>
                </Stack>
              )}
              {identity.meta?.insights?.lensFollow && (
                <Stack spacing={1} direction="row" alignItems="center">
                  <LensAvatar size={15} />
                  <Typography variant="caption" fontWeight="bold">
                    {identity.meta.insights.lensFollow === 'mutual'
                      ? 'Mutual follow'
                      : 'You follow them'}
                  </Typography>
                </Stack>
              )}
              {identity.meta?.insights && identity.meta.insights.sentTxs > 0 && (
                <Stack spacing={1} direction="row" alignItems="center">
                  <Avatar src="/ethereum.png" sx={{ width: 15, height: 15 }} />
                  <Typography variant="caption" fontWeight="bold">
                    {`Transacted ${
                      identity.meta.insights.sentTxs === 1
                        ? 'once'
                        : (identity.meta.insights.sentTxs > 5
                            ? '5+'
                            : identity.meta.insights.sentTxs) + ' times'
                    }`}
                  </Typography>
                </Stack>
              )}
              {tags?.includes('hypersub') && (
                <Stack spacing={1} direction="row" alignItems="center">
                  <Avatar src="/fabric.png" sx={{ width: 15, height: 15 }} />
                  <Typography variant="caption" fontWeight="bold">
                    Fabric subscriber
                  </Typography>
                </Stack>
              )}
              {tags?.includes('paragraph') && (
                <Stack spacing={1} direction="row" alignItems="center">
                  <Avatar
                    variant="square"
                    src="/paragraph.png"
                    sx={{
                      width: 15,
                      height: 15,
                      backgroundColor: prefersDarkMode ? 'inherit' : grey[700]
                    }}
                  />
                  <Typography variant="caption" fontWeight="bold">
                    Paragraph subscriber
                  </Typography>
                </Stack>
              )}
              {tags?.includes('alfafrens') && (
                <Stack spacing={1} direction="row" alignItems="center">
                  <Avatar src="/alfafrens.png" sx={{ width: 15, height: 15 }} />
                  <Typography variant="caption" fontWeight="bold">
                    Subscribed to channel
                  </Typography>
                </Stack>
              )}
              {tags?.includes('efp') && (
                <Stack spacing={1} direction="row" alignItems="center">
                  <Avatar variant="rounded" src="/dapps/efp.png" sx={{ width: 15, height: 15 }} />
                  <Typography variant="caption" fontWeight="bold">
                    You follow them
                  </Typography>
                </Stack>
              )}
            </>
          ) : (
            <Typography variant="caption" fontWeight="bold">
              No connections found
            </Typography>
          )
        ) : (
          <Typography variant="caption" fontWeight="bold">
            For social connections connect wallet
          </Typography>
        )}
      </Box>
    </Popover>
  );
};
