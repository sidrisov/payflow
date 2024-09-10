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
import { IdentityType, SocialInfoType } from '../../types/ProfileType';
import { useContext } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { TbCopy, TbStar, TbStarOff } from 'react-icons/tb';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { IoPeople } from 'react-icons/io5';
import { BsFillPersonFill } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { FARCASTER_DAPP, LENS_DAPP, socialLink, ZAPPER } from '../../utils/dapps';
import { SiFarcaster } from 'react-icons/si';
import { FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { IoIosChatbubbles } from 'react-icons/io';

export function SearchIdentityMenu({
  identity,
  onInviteClick,
  onFavouriteClick,
  onSocilLinksClick,
  favourite,
  ...props
}: {
  identity: IdentityType;
  favourite?: boolean;
  onInviteClick?: () => void;
  onFavouriteClick?: () => void;
  onSocilLinksClick?: () => void;
} & MenuProps) {
  const { isAuthenticated } = useContext(ProfileContext);
  const navigate = useNavigate();
  const ens = identity.meta?.ens;
  const address = identity.address;
  const socials = identity.meta?.socials || [];

  const farcasterProfile = socials.find((social) => social.dappName === FARCASTER_DAPP);

  const renderSocialMenuItem = (social: SocialInfoType) => {
    let icon;
    let isPowerUser = false;

    switch (social.dappName) {
      case FARCASTER_DAPP:
        icon = <SiFarcaster />;
        isPowerUser = social.isFarcasterPowerUser || false;
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
        component="a"
        href={socialLink(social.dappName, social.profileName)}
        target="_blank"
        sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
        <ListItemIcon>{icon}</ListItemIcon>
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography noWrap fontSize={14}>
              {social.profileName}
            </Typography>
            {isPowerUser && <FaCheckCircle size={16} />}
          </Stack>
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
    navigate(`/${identity.profile?.username ?? identity.address}`);
  };

  const handleChatClick = () => {
    if (farcasterProfile) {
      const warpcastUrl = `https://warpcast.com/~/inbox/create/${farcasterProfile.profileId}`;
      window.open(warpcastUrl, '_blank');
    }
  };

  return (
    <Menu
      {...props}
      sx={{ '.MuiMenu-paper': { borderRadius: 5 }, zIndex: 1450 }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}>
      <MenuList dense disablePadding>
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <BsFillPersonFill />
          </ListItemIcon>
          Profile
        </MenuItem>
        {farcasterProfile && (
          <MenuItem onClick={handleChatClick}>
            <ListItemIcon>
              <IoIosChatbubbles />
            </ListItemIcon>
            Message
          </MenuItem>
        )}
        <MenuItem onClick={onSocilLinksClick}>
          <ListItemIcon>
            <IoPeople />
          </ListItemIcon>
          Connections
        </MenuItem>
        <Divider />
        {socials.map(renderSocialMenuItem)}
        {ens && (
          <MenuItem
            onClick={() => {
              copyToClipboard(ens);
              toast.success('ENS copied!');
            }}>
            <ListItemIcon>
              <TbCopy />
            </ListItemIcon>
            {ens}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            copyToClipboard(address);
            toast.success('Address copied!');
          }}>
          <ListItemIcon>
            <TbCopy />
          </ListItemIcon>
          {shortenWalletAddressLabel2(address)}
        </MenuItem>
        {isAuthenticated && (
          <>
            <Divider />
            <MenuItem onClick={onFavouriteClick}>
              <ListItemIcon>{favourite ? <TbStarOff /> : <TbStar />}</ListItemIcon>
              {favourite ? 'Remove from favourites' : 'Add to favourites'}
            </MenuItem>
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
        <Divider />
        <MenuItem component="a" href={socialLink(ZAPPER, address)} target="_blank">
          <ListItemIcon>
            <Avatar src="/dapps/zapper.png" sx={{ width: 20, height: 20 }} />
          </ListItemIcon>
          More on Zapper
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
