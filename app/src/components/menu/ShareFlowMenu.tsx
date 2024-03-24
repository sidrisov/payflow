import { Avatar, ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { ProfileType } from '../../types/ProfleType';
import { FilterFrames, Person } from '@mui/icons-material';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { DAPP_URL, FRAMES_URL } from '../../utils/urlConstants';
import { toast } from 'react-toastify';
import { FlowType } from '../../types/FlowType';

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
      style={{ borderRadius: '50px' }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
      <MenuItem
        onClick={() => {
          copyToClipboard(`${DAPP_URL}/${profile.username}`);
          toast.success('Profile link copied!');
        }}>
        <ListItemIcon>
          <Person fontSize="small" />
        </ListItemIcon>
        Profile link
      </MenuItem>

      <MenuItem
        onClick={() => {
          copyToClipboard(`${FRAMES_URL}/${profile.username}`);
          toast.success('Profile frame link copied!');
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
            copyToClipboard(link);
            toast.success('Jar link copied!');
          }}
          sx={{ fontSize: '10' }}>
          <ListItemIcon>
            <Avatar src="/jar.png" sx={{ width: 20, height: 20 }} />
          </ListItemIcon>
          Jar link
        </MenuItem>
      )}

      {selectedFlow && selectedFlow.type === 'JAR' && (
        <MenuItem
          onClick={() => {
            const link = `${FRAMES_URL}/jar/${selectedFlow.uuid}`;
            copyToClipboard(link);
            toast.success('Jar frame link copied!');
          }}>
          <ListItemIcon>
            <FilterFrames fontSize="small" />
          </ListItemIcon>
          Frame link
        </MenuItem>
      )}
    </Menu>
  );
}
