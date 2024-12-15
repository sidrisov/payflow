import { ListItemIcon, Menu, MenuItem, MenuList, MenuProps } from '@mui/material';
import { ProfileType } from '../../types/ProfileType';
import { FilterFrames, Person } from '@mui/icons-material';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { DAPP_URL, FRAMES_URL } from '../../utils/urlConstants';
import { toast } from 'react-toastify';
import { FlowType } from '../../types/FlowType';
import { PiTipJar } from 'react-icons/pi';

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
      sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5 } }}
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

        <MenuItem
          onClick={() => {
            copyToClipboard(`${FRAMES_URL}/${profile.username}`, 'Profile frame link copied!');
          }}>
          <ListItemIcon>
            <FilterFrames fontSize="small" />
          </ListItemIcon>
          Profile frame
        </MenuItem>

        {selectedFlow && selectedFlow.type === 'JAR' && (
          <MenuItem
            onClick={() => {
              const link = `${DAPP_URL}/jar/${selectedFlow.uuid}`;
              copyToClipboard(link, 'Jar link copied!');
            }}
            sx={{ fontSize: '10' }}>
            <ListItemIcon>
              <PiTipJar size={20} />
            </ListItemIcon>
            Jar link
          </MenuItem>
        )}

        {selectedFlow && selectedFlow.type === 'JAR' && (
          <MenuItem
            onClick={() => {
              const link = `${FRAMES_URL}/jar/${selectedFlow.uuid}`;
              copyToClipboard(link, 'Jar frame link copied!');
            }}>
            <ListItemIcon>
              <FilterFrames fontSize="small" />
            </ListItemIcon>
            Jar frame
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  );
}
