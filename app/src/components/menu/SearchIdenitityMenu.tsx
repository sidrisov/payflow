import {
  Avatar,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  MenuList,
  MenuProps,
  Stack,
  Typography
} from '@mui/material';
import { PersonAdd, OpenInNew } from '@mui/icons-material';
import { IdentityType, SocialInfoType } from '@payflow/common';
import { useContext } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { TbCopy, TbStar, TbStarOff } from 'react-icons/tb';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { IoPeople } from 'react-icons/io5';
import { BsFillPersonFill } from 'react-icons/bs';
import { FARCASTER_DAPP, LENS_DAPP, socialLink, ZAPPER } from '../../utils/dapps';
import { SiFarcaster } from 'react-icons/si';
import { IoIosChatbubbles } from 'react-icons/io';
import { DAPP_URL } from '../../utils/urlConstants';
import { FaSquare } from 'react-icons/fa6';
import FrameV2SDK from '@farcaster/frame-sdk';

export function IdentityMenu({
  identity,
  favourite,
  onInviteClick,
  onFavouriteClick,
  onSocilLinksClick,
  currentIdentity = false,
  ...props
}: {
  identity: IdentityType;
  favourite?: boolean;
  onInviteClick?: () => void;
  onFavouriteClick?: () => void;
  onSocilLinksClick?: () => void;
  currentIdentity?: boolean;
} & MenuProps) {
  const { isAuthenticated, isFrameV2 } = useContext(ProfileContext);
  const ens = identity.meta?.ens;
  const address = identity.address;
  const socials = identity.meta?.socials || [];

  const farcasterProfile = socials.find((social) => social.dappName === FARCASTER_DAPP);

  const renderSocialMenuItem = (social: SocialInfoType) => {
    let icon;

    switch (social.dappName) {
      case FARCASTER_DAPP:
        icon = <SiFarcaster />;
        break;
      case LENS_DAPP:
        icon = <Avatar src="/dapps/lens.png" sx={{ width: 20, height: 20 }} />;
        break;
      default:
        return null;
    }

    return (
      <MenuItem
        key={`${social.dappName}-${social.profileName}`}
        {...(isFrameV2 && social.profileId
          ? {
              onClick: () =>
                FrameV2SDK.actions.viewProfile({
                  fid: Number(social.profileId)
                })
            }
          : {
              component: 'a',
              href: socialLink(social.dappName, social.profileName),
              target: '_blank'
            })}
        sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
        <ListItemIcon>{icon}</ListItemIcon>
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography>{social.profileName}</Typography>
          {social.followerCount && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {social.followerCount} followers
            </Typography>
          )}
        </Stack>
        <OpenInNew sx={{ marginLeft: 'auto', paddingLeft: 1 }} />
      </MenuItem>
    );
  };

  const handleProfileClick = () => {
    const path = `/${identity.profile?.username ?? identity.address}`;
    window.location.href = path;
  };

  const handleChatClick = () => {
    if (farcasterProfile) {
      const warpcastUrl = `https://warpcast.com/~/inbox/create/${farcasterProfile.profileId}`;
      window.open(warpcastUrl, '_blank');
    }
  };

  const showAuthenticatedSection =
    isAuthenticated &&
    (onFavouriteClick || (onInviteClick && !identity.invited && !identity.profile));

  return (
    <Menu
      {...props}
      sx={{
        '& .MuiMenu-paper': {
          borderRadius: 5,
          mt: 0.5
        },
        '& .MuiList-root': {
          p: 0
        },
        zIndex: 1450
      }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}>
      <MenuList>
        {!currentIdentity && (
          <MenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <BsFillPersonFill />
            </ListItemIcon>
            <Typography sx={{ flex: 1 }}>Profile</Typography>
            <OpenInNew sx={{ marginLeft: 'auto', paddingLeft: 1 }} />
          </MenuItem>
        )}
        {farcasterProfile && (
          <MenuItem onClick={handleChatClick}>
            <ListItemIcon>
              <IoIosChatbubbles />
            </ListItemIcon>
            <Typography sx={{ flex: 1 }}>Message</Typography>
            <OpenInNew sx={{ marginLeft: 'auto', paddingLeft: 1 }} />
          </MenuItem>
        )}
        <MenuItem onClick={onSocilLinksClick}>
          <ListItemIcon>
            <IoPeople />
          </ListItemIcon>
          Connections
        </MenuItem>
        <Divider sx={{ borderBottomWidth: 10, my: 0, '&.MuiDivider-root': { my: 0 } }} />
        <MenuItem
          onClick={() => {
            const paymentFrameUrl = `${DAPP_URL}/${address}`;
            copyToClipboard(paymentFrameUrl, 'Pay Me frame URL copied!');
          }}>
          <ListItemIcon>
            <FaSquare />
          </ListItemIcon>
          <Stack>
            <Typography>Pay Me</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Copy & embed frame in socials
            </Typography>
          </Stack>
        </MenuItem>
        {socials.map(renderSocialMenuItem)}
        {ens && (
          <MenuItem
            onClick={() => {
              copyToClipboard(ens, 'ENS copied!');
            }}>
            <ListItemIcon>
              <TbCopy />
            </ListItemIcon>
            {ens}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            copyToClipboard(address, 'Address copied!');
          }}>
          <ListItemIcon>
            <TbCopy />
          </ListItemIcon>
          {shortenWalletAddressLabel2(address)}
        </MenuItem>
        {showAuthenticatedSection && (
          <>
            <Divider sx={{ borderBottomWidth: 10, my: 0, '&.MuiDivider-root': { my: 0 } }} />
            {onFavouriteClick && (
              <MenuItem onClick={onFavouriteClick}>
                <ListItemIcon>{favourite ? <TbStarOff /> : <TbStar />}</ListItemIcon>
                {favourite ? 'Remove from favourites' : 'Add to favourites'}
              </MenuItem>
            )}
            {onInviteClick && !identity.invited && !identity.profile && (
              <MenuItem onClick={onInviteClick}>
                <ListItemIcon>
                  <PersonAdd />
                </ListItemIcon>
                Invite
              </MenuItem>
            )}
          </>
        )}
        <Divider sx={{ borderBottomWidth: 10, my: 0, '&.MuiDivider-root': { my: 0 } }} />
        <MenuItem component="a" href={socialLink(ZAPPER, address)} target="_blank">
          <ListItemIcon>
            <Avatar src="/dapps/zapper.png" sx={{ width: 20, height: 20 }} />
          </ListItemIcon>
          <Typography sx={{ flex: 1 }}>More on Zapper</Typography>
          <OpenInNew sx={{ marginLeft: 'auto', paddingLeft: 1 }} />
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
