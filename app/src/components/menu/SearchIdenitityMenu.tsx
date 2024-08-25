import { Avatar, Divider, ListItemIcon, Menu, MenuItem, MenuList, MenuProps } from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { IdentityType } from '../../types/ProfileType';
import { useContext } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { TbCopy, TbStar, TbStarOff } from 'react-icons/tb';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { IoPeople } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { FARCASTER_DAPP, socialLink, ZAPPER } from '../../utils/dapps';
import { SiFarcaster } from 'react-icons/si';

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
  const ens = identity.meta?.ens;
  const address = identity.address;
  const farcasterName = identity.meta?.socials?.find(
    (s) => s.dappName === FARCASTER_DAPP
  )?.profileName;

  return (
    <Menu
      {...props}
      sx={{ '.MuiMenu-paper': { borderRadius: 5 }, zIndex: 1350 }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}>
      <MenuList dense disablePadding>
        <MenuItem onClick={onSocilLinksClick}>
          <ListItemIcon>
            <IoPeople />
          </ListItemIcon>
          Connections
        </MenuItem>
        <Divider />
        {farcasterName && (
          <MenuItem component="a" href={socialLink(FARCASTER_DAPP, farcasterName)} target="_blank">
            <ListItemIcon>
              <SiFarcaster />
            </ListItemIcon>
            {farcasterName}
          </MenuItem>
        )}
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
