import { Divider, ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { ProfileType } from '../types/ProfleType';
import { useNavigate } from 'react-router-dom';
import { Logout, Person, Settings } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ProfileSection } from './ProfileSection';
import { API_URL } from '../utils/urlConstants';

export function ProfileMenu(
  props: MenuProps & {
    profile: ProfileType;
  }
) {
  const navigate = useNavigate();

  const { profile } = props;

  return (
    <Menu
      {...props}
      sx={{ mt: 1 }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
      <MenuItem
        sx={{ minWidth: 150 }}
        onClick={async () => {
          navigate(`/${profile.username}`);
        }}>
        <ProfileSection profile={profile} />
      </MenuItem>
      <Divider />
      <MenuItem
        onClick={async () => {
          navigate(`/${profile.username}`);
        }}>
        <ListItemIcon>
          <Person fontSize="small" />
        </ListItemIcon>
        Profile
      </MenuItem>

      <MenuItem
        onClick={() => {
          navigate('/settings');
        }}>
        <ListItemIcon>
          <Settings fontSize="small" />
        </ListItemIcon>
        Settings
      </MenuItem>
      <Divider />
      <MenuItem
        sx={{ color: 'red' }}
        onClick={async () => {
          try {
            await axios.get(`${API_URL}/api/auth/logout`, {
              withCredentials: true
            });
            navigate('/connect');
          } catch (error) {
            toast.error('Failed to logout!');
          }
        }}>
        <ListItemIcon sx={{ color: 'red' }}>
          <Logout fontSize="small" />
        </ListItemIcon>
        Logout
      </MenuItem>
    </Menu>
  );
}
