import { Divider, ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { ProfileType } from '../types/ProfleType';
import { useNavigate } from 'react-router-dom';
import {
  DarkModeOutlined,
  LightModeOutlined,
  Logout,
  Person,
  Settings
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ProfileSection } from './ProfileSection';
import { API_URL } from '../utils/urlConstants';
import { useAccount } from 'wagmi';
import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { CloseCallbackType } from '../types/CloseCallbackType';

export function ProfileMenu(
  props: MenuProps &
    CloseCallbackType & {
      profile: ProfileType;
    }
) {
  const navigate = useNavigate();
  const { connector } = useAccount();

  const { profile, closeStateCallback } = props;

  const { appSettings, setAppSettings } = useContext(UserContext);

  return (
    <Menu
      {...props}
      sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5 } }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
      <MenuItem
        sx={{ minWidth: 150 }}
        onClick={async () => {
          closeStateCallback();
          navigate(`/${profile.username}`);
        }}>
        <ProfileSection profile={profile} />
      </MenuItem>
      <Divider />
      <MenuItem
        onClick={async () => {
          closeStateCallback();
          navigate('/profile');
        }}>
        <ListItemIcon>
          <Person fontSize="small" />
        </ListItemIcon>
        Profile
      </MenuItem>

      <MenuItem
        onClick={() => {
          closeStateCallback();
          navigate('/settings');
        }}>
        <ListItemIcon>
          <Settings fontSize="small" />
        </ListItemIcon>
        Settings
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => setAppSettings({ ...appSettings, darkMode: !appSettings.darkMode })}>
        <ListItemIcon>
          {appSettings.darkMode ? (
            <DarkModeOutlined fontSize="small" />
          ) : (
            <LightModeOutlined fontSize="small" />
          )}
        </ListItemIcon>
        {appSettings.darkMode ? 'Dark' : 'Light'}
      </MenuItem>
      <Divider />
      <MenuItem
        sx={{ color: 'red' }}
        onClick={async () => {
          try {
            await axios.get(`${API_URL}/api/auth/logout`, {
              withCredentials: true
            });
            await connector?.disconnect();
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
