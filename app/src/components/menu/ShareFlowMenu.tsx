import { ListItemIcon, Menu, MenuItem, MenuList, MenuProps } from '@mui/material';
import { ProfileType, FlowType } from '@payflow/common';
import { Person } from '@mui/icons-material';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { DAPP_URL } from '../../utils/urlConstants';

export function ShareFlowMenu({
  profile,
  selectedFlow,
  ...props
}: MenuProps & {
  profile: ProfileType;
  selectedFlow: FlowType;
}) {
  return (
    <Menu
      {...props}
      sx={{ mt: 1 }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
      <MenuList dense disablePadding>
        <MenuItem
          onClick={() => {
            copyToClipboard(`${DAPP_URL}/${profile.username}`, 'Profile link copied!');
          }}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile link
        </MenuItem>


      </MenuList>
    </Menu>
  );
}
