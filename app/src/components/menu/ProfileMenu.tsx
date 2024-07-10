import { Divider, ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { ProfileType } from '../../types/ProfleType';
import { useNavigate } from 'react-router-dom';
import {
  DarkModeOutlined,
  GridView,
  Groups,
  LeaderboardRounded,
  LightModeOutlined,
  LiveHelp,
  Logout,
  Person,
  PersonAdd,
  Settings
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ProfileSection } from '../ProfileSection';
import { API_URL } from '../../utils/urlConstants';
import { useContext } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { usePrivy } from '@privy-io/react-auth';

export function ProfileMenu({
  profile,
  closeStateCallback,
  loginRedirectOnLogout = true,
  ...props
}: { loginRedirectOnLogout?: boolean } & MenuProps &
  CloseCallbackType & {
    profile: ProfileType;
  }) {
  const navigate = useNavigate();

  const { appSettings, setAppSettings } = useContext(ProfileContext);
  const { logout } = usePrivy();

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
        <ProfileSection maxWidth={150} profile={profile} />
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
        onClick={async () => {
          closeStateCallback();
          navigate('/invite');
        }}>
        <ListItemIcon>
          <PersonAdd fontSize="small" />
        </ListItemIcon>
        Invite
      </MenuItem>
      <MenuItem
        onClick={async () => {
          closeStateCallback();
          navigate('/actions');
        }}>
        <ListItemIcon>
          <GridView fontSize="small" />
        </ListItemIcon>
        Actions
      </MenuItem>
      <MenuItem
        onClick={async () => {
          closeStateCallback();
          navigate('/advanced');
        }}>
        <ListItemIcon>
          <Settings fontSize="small" />
        </ListItemIcon>
        Advanced
      </MenuItem>
      <Divider />
      <MenuItem
        onClick={async () => {
          closeStateCallback();
          navigate('/leaderboard');
        }}>
        <ListItemIcon>
          <LeaderboardRounded fontSize="small" />
        </ListItemIcon>
        Board
      </MenuItem>
      <MenuItem component="a" href="https://warpcast.com/~/channel/payflow" target="_blank">
        <ListItemIcon>
          <Groups fontSize="small" />
        </ListItemIcon>
        Channel
      </MenuItem>
      <MenuItem
        component="a"
        href="https://payflowlabs.notion.site/Payflow-FAQs-20593cf7734e4d78ad0dc91c8e8982e5"
        target="_blank">
        <ListItemIcon>
          <LiveHelp fontSize="small" />
        </ListItemIcon>
        FAQ
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
            await logout();
            if (loginRedirectOnLogout) {
              navigate('/connect');
            } else {
              // just refresh
              navigate(0);
            }
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
