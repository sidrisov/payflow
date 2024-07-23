import {
  Box,
  Stack,
  Button,
  BoxProps,
  Avatar,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import { ContactType } from '../types/ProfleType';
import { ProfileSection } from './ProfileSection';
import { AddressSection } from './AddressSection';
import { comingSoonToast } from './Toasts';
import { useContext } from 'react';
import { ProfileContext } from '../contexts/UserContext';
import axios from 'axios';
import { API_URL } from '../utils/urlConstants';
import { toast } from 'react-toastify';
import { shortenWalletAddressLabel } from '../utils/address';
import { InvitedChip, InviteChip } from './chips/IdentityStatusChips';
import { green, grey, yellow } from '@mui/material/colors';
import { useAccount } from 'wagmi';
import { UpdateIdentityCallbackType } from './dialogs/SearchIdentityDialog';
import { SocialPresenceStack } from './SocialPresenceStack';
import { Star, StarBorder, TipsAndUpdatesTwoTone } from '@mui/icons-material';

function addToFavourites(tags: string[]): string[] {
  const updatedTags = tags ?? [];
  updatedTags.push('favourites');
  return updatedTags;
}

function removeFromFavourites(tags: string[]): string[] {
  const index = tags.indexOf('favourites');
  if (index !== -1) {
    tags.splice(index, 1);
  }
  return tags;
}

export function SearchIdentityListItem(
  props: BoxProps &
    UpdateIdentityCallbackType & {
      contact: ContactType;
      view: 'address' | 'profile';
    }
) {
  const { profile, isAuthenticated } = useContext(ProfileContext);
  const { contact, view, updateIdentityCallback } = props;

  const identity = contact.data;
  const tags = contact.tags;

  console.log('Identity:', contact);

  const favourite = tags?.includes('favourites');
  const { address } = useAccount();

  return (
    (view === 'profile' ? identity.profile : identity.meta) && (
      <Box
        m={1}
        pl={0.5}
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        width={'100%'}
        height={60}>
        <Stack direction="row" spacing={1} alignItems="center">
          {isAuthenticated && (
            <IconButton
              size="small"
              onClick={async () => {
                console.log('Hello', contact);
                try {
                  const updatedContact = {
                    ...contact,
                    tags: !favourite
                      ? addToFavourites(contact.tags as string[])
                      : removeFromFavourites(contact.tags as string[])
                  } as ContactType;

                  console.log('Before vs after: ', contact, updatedContact);

                  await axios.post(`${API_URL}/api/user/me/favourites`, updatedContact, {
                    withCredentials: true
                  });

                  updateIdentityCallback?.({ contact: updatedContact });
                } catch (error) {
                  toast.error('Favourite failed!');
                }
              }}>
              {favourite ? (
                <Star fontSize="small" sx={{ color: yellow.A700 }} />
              ) : (
                <StarBorder fontSize="small" />
              )}
            </IconButton>
          )}
          <Box
            justifyContent="flex-start"
            minWidth={175}
            maxWidth={200}
            color="inherit"
            {...(props.onClick
              ? { component: Button, onClick: props.onClick, textTransform: 'none' }
              : {})}
            sx={{ borderRadius: 5 }}>
            {view === 'profile' && identity.profile && (
              <ProfileSection maxWidth={200} profile={identity.profile} />
            )}

            {view === 'address' && identity.meta && (
              <AddressSection maxWidth={200} identity={identity} />
            )}
          </Box>
        </Stack>

        <Stack direction="column" spacing={0.5} alignItems="center" sx={{ width: 100 }}>
          {identity.invited && !identity.profile ? (
            <InvitedChip />
          ) : (
            isAuthenticated &&
            !identity.profile && (
              <InviteChip
                identity={identity}
                onClick={async () => {
                  if (profile?.identityInviteLimit === -1) {
                    comingSoonToast();
                    return;
                  }

                  if (profile?.identityInviteLimit === 0) {
                    toast.warn("You don't have any invites");
                    return;
                  }

                  try {
                    await axios.post(
                      `${API_URL}/api/invitations`,
                      {
                        identityBased: identity.address
                      },
                      { withCredentials: true }
                    );

                    toast.success(
                      `${
                        identity.meta?.ens
                          ? identity.meta?.ens
                          : shortenWalletAddressLabel(identity.address)
                      } is invited!`
                    );

                    updateIdentityCallback?.({
                      contact: { ...contact, data: { ...contact.data, invited: true } }
                    });
                  } catch (error) {
                    toast.error('Invitation failed!');
                  }
                }}
              />
            )
          )}

          {identity.meta && (
            <SocialPresenceStack
              key={`social_presence_stack_${identity.address}`}
              meta={identity.meta}
            />
          )}
        </Stack>
        <Stack spacing={1} direction="row" alignItems="center">
          <Tooltip
            arrow
            disableFocusListener
            enterDelay={50}
            enterTouchDelay={300}
            title={
              profile?.identity || address ? (
                (profile?.identity ?? address) === identity.profile?.identity ? (
                  <Typography variant="caption" fontWeight="bold">
                    Your {view === 'profile' ? 'profile' : 'address'}
                  </Typography>
                ) : identity?.meta?.insights?.farcasterFollow ||
                  identity?.meta?.insights?.lensFollow ||
                  identity?.meta?.insights?.sentTxs ||
                  tags?.includes('hypersub') ||
                  tags?.includes('alfafrens') ? (
                  <>
                    {identity.meta?.insights?.farcasterFollow && (
                      <Stack spacing={1} direction="row" alignItems="center">
                        <Avatar src="/farcaster.svg" sx={{ width: 15, height: 15 }} />
                        <Typography variant="caption" fontWeight="bold">
                          {identity.meta.insights.farcasterFollow === 'mutual'
                            ? 'Mutual follow'
                            : 'You follow them'}
                        </Typography>
                      </Stack>
                    )}
                    {identity.meta?.insights?.lensFollow && (
                      <Stack spacing={1} direction="row" alignItems="center">
                        <Avatar src="/lens.svg" sx={{ width: 15, height: 15 }} />
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
                          Subscribed to NFT
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
                  </>
                ) : (
                  <Typography variant="caption" fontWeight="bold">
                    No insights
                  </Typography>
                )
              ) : (
                <Typography variant="caption" fontWeight="bold">
                  For insights connect wallet
                </Typography>
              )
            }>
            <TipsAndUpdatesTwoTone
              sx={{
                color:
                  identity?.meta?.insights?.farcasterFollow ||
                  identity?.meta?.insights?.lensFollow ||
                  identity?.meta?.insights?.sentTxs ||
                  tags?.includes('hypersub') ||
                  tags?.includes('alfafrens') ||
                  ((profile?.identity || address) &&
                    (profile?.identity ?? address) === identity.profile?.identity)
                    ? green.A700
                    : grey.A700,
                width: 20,
                height: 20
              }}
            />
          </Tooltip>
        </Stack>
      </Box>
    )
  );
}
