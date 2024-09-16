import { Box, Stack, BoxProps, Avatar, IconButton, Typography, Popover } from '@mui/material';
import { ContactType } from '../types/ProfileType';
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
import { MoreVert } from '@mui/icons-material';
import { SearchIdentityMenu } from './menu/SearchIdenitityMenu';
import { useSearchParams } from 'react-router-dom';
import { grey } from '@mui/material/colors';
import { useDarkMode } from '../utils/hooks/useDarkMode';

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
      minimized?: boolean;
      contact: ContactType;
      view: 'address' | 'profile';
    }
) {
  const prefersDarkMode = useDarkMode();

  const accessToken = useSearchParams()[0].get('access_token') ?? undefined;

  const { profile } = useContext(ProfileContext);
  const { contact, view, updateIdentityCallback, minimized = false } = props;

  const identity = contact.data;
  const tags = contact.tags;

  const favourite = tags?.includes('favourites');
  const { address } = useAccount();

  const [openIdentityMenu, setOpenIdentityMenu] = useState(false);
  const [openSocialLinksPopover, setOpenSocialLinksPopover] = useState(false);
  const [identityMenuAnchorEl, setIdentityMenuAnchorEl] = useState<null | HTMLElement>(null);

  const [isHoveringMenu, setIsHoveringMenu] = useState(false);

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

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setOpenIdentityMenu(true);
    setIdentityMenuAnchorEl(event.currentTarget);
  };

  const handleBoxClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (props.onClick) {
      props?.onClick(event);
    }
  };

  return (
    <>
      {(view === 'profile' ? identity.profile : identity.meta) && (
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
          height={55}
          {...(!isHoveringMenu && { onClick: handleBoxClick })}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: isHoveringMenu ? 'inherit' : 'action.hover'
            },
            borderRadius: 4,
            padding: 1,
            WebkitTapHighlightColor: 'transparent'
          }}>
          {view === 'profile' && identity.profile && (
            <ProfileSection maxWidth={300} profile={identity.profile} />
          )}
          {view === 'address' && identity.meta && (
            <AddressSection maxWidth={300} identity={identity} />
          )}
          {!minimized && (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClick(e);
              }}
              onMouseEnter={() => setIsHoveringMenu(true)}
              onMouseLeave={() => setIsHoveringMenu(false)}
              size="small">
              <MoreVert />
            </IconButton>
          )}
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
              tags?.includes('moxie') ? (
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
                {tags?.includes('moxie') && (
                  <Stack spacing={1} direction="row" alignItems="center">
                    <Avatar variant="square" src="/moxie.png" sx={{ width: 15, height: 15 }} />
                    <Typography variant="caption" fontWeight="bold">
                      Fan token holder
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
    </>
  );
}
