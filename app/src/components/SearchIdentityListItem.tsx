import {
  Box,
  Stack,
  Button,
  BoxProps,
  Avatar,
  IconButton,
  Typography,
  Popover
} from '@mui/material';
import { ContactType } from '../types/ProfleType';
import { ProfileSection } from './ProfileSection';
import { AddressSection } from './AddressSection';
import { useContext, useState } from 'react';
import { ProfileContext } from '../contexts/UserContext';
import axios from 'axios';
import { API_URL } from '../utils/urlConstants';
import { toast } from 'react-toastify';
import { shortenWalletAddressLabel } from '../utils/address';
import { useAccount } from 'wagmi';
import { UpdateIdentityCallbackType } from './dialogs/SearchIdentityDialog';
import { SocialPresenceStack } from './SocialPresenceStack';
import { MoreHoriz } from '@mui/icons-material';
import { SearchIdentityMenu } from './menu/SearchIdenitityMenu';
import { useSearchParams } from 'react-router-dom';

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
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get('access_token') ?? '';

  const { profile } = useContext(ProfileContext);
  const { contact, view, updateIdentityCallback } = props;

  const identity = contact.data;
  const tags = contact.tags;

  const favourite = tags?.includes('favourites');
  const { address } = useAccount();

  const [openIdentityMenu, setOpenIdentityMenu] = useState(false);
  const [openSocialLinksPopover, setOpenSocialLinksPopover] = useState(false);
  const [identityMenuAnchorEl, setIdentityMenuAnchorEl] = useState<null | HTMLElement>(null);

  const inviteClickHandler = async () => {
    if (profile?.identityInviteLimit === 0 || profile?.identityInviteLimit === 1) {
      toast.warn("You don't have any invites");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/invitations${accessToken ? '?access_token=' + accessToken : ''}`,
        {
          identityBased: identity.address
        },
        { withCredentials: true }
      );

      toast.success(
        `${
          identity.meta?.ens ? identity.meta?.ens : shortenWalletAddressLabel(identity.address)
        } is invited!`
      );

      updateIdentityCallback?.({
        contact: { ...contact, data: { ...contact.data, invited: true } }
      });
    } catch (error) {
      toast.error('Invitation failed!');
    }
  };

  const favouriteClickHandler = async () => {
    try {
      const updatedContact = {
        ...contact,
        tags: !favourite
          ? addToFavourites(contact.tags as string[])
          : removeFromFavourites(contact.tags as string[])
      } as ContactType;

      console.log('Before vs after: ', contact, updatedContact);

      await axios.post(
        `${API_URL}/api/user/me/favourites${accessToken ? '?access_token=' + accessToken : ''}`,
        updatedContact,
        {
          withCredentials: true
        }
      );

      updateIdentityCallback?.({ contact: updatedContact });
    } catch (error) {
      toast.error('Favourite failed!');
    }
  };

  const socialLinksClickHandler = async () => {
    setOpenSocialLinksPopover(true);
  };

  return (
    <>
      {(view === 'profile' ? identity.profile : identity.meta) && (
        <Box
          m={1}
          pl={0.5}
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
          height={60}>
          <Stack direction="row" spacing={1} alignItems="center">
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
            {identity.meta && (
              <SocialPresenceStack
                key={`social_presence_stack_${identity.address}`}
                meta={identity.meta}
              />
            )}
          </Stack>

          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              setOpenIdentityMenu(true);
              setIdentityMenuAnchorEl(event.currentTarget);
            }}>
            <MoreHoriz fontSize="small" />
          </IconButton>
        </Box>
      )}
      {openIdentityMenu && (
        <SearchIdentityMenu
          open={true}
          identity={identity}
          {...((profile?.identityInviteLimit ?? 0 > 0) && {
            onInviteClick: inviteClickHandler
          })}
          onFavouriteClick={favouriteClickHandler}
          onSocilLinksClick={socialLinksClickHandler}
          favourite={favourite}
          anchorEl={identityMenuAnchorEl}
          onClose={() => {
            setOpenIdentityMenu(false);
          }}
          onClick={() => {
            setOpenIdentityMenu(false);
          }}
        />
      )}
      <Popover
        open={openSocialLinksPopover}
        anchorEl={identityMenuAnchorEl}
        onClose={async () => {
          setOpenSocialLinksPopover(false);
        }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 5
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}>
        <Box p={1}>
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
                      Fabric Subscriber
                    </Typography>
                  </Stack>
                )}
                {tags?.includes('paragraph') && (
                  <Stack spacing={1} direction="row" alignItems="center">
                    <Avatar variant='square' src="/paragraph.png" sx={{ width: 15, height: 15 }} />
                    <Typography variant="caption" fontWeight="bold">
                      Paragraph Subscriber
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
          )}
        </Box>
      </Popover>
    </>
  );
}
