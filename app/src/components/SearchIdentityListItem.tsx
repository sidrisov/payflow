import { Box, BoxProps, IconButton } from '@mui/material';
import { ContactType } from '@payflow/common';
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
import { IdentityMenu } from './menu/SearchIdenitityMenu';
import { useSearchParams } from 'react-router-dom';
import { SocialLinksPopover } from './dialogs/SocialLinksPopover';

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
        <IdentityMenu
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
      <SocialLinksPopover
        open={openSocialLinksPopover}
        anchorEl={identityMenuAnchorEl}
        onClose={() => setOpenSocialLinksPopover(false)}
        identity={identity}
        profile={profile}
        address={address}
        view={view}
        tags={tags}
      />
    </>
  );
}
