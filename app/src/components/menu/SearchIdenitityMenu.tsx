import { Divider, ListItemIcon, Menu, MenuItem, MenuList, MenuProps } from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { IdentityType } from '../../types/ProfileType';
import { useContext } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { TbCopy, TbStar, TbStarOff } from 'react-icons/tb';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { IoPeople } from 'react-icons/io5';
import { toast } from 'react-toastify';

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

  return (
    <Menu
      {...props}
      sx={{ '.MuiMenu-paper': { borderRadius: 5 }, zIndex: 1550 }}
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
        <MenuItem
          onClick={() => {
            copyToClipboard(identity.address);
            toast.success('Copied!');
          }}>
          <ListItemIcon>
            <TbCopy />
          </ListItemIcon>
          {shortenWalletAddressLabel2(identity.address)}
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
      </MenuList>
    </Menu>
  );
}
