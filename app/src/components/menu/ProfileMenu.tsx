import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  MenuProps
} from '@mui/material';
import { ProfileType } from '../../types/ProfileType';
import { useNavigate } from 'react-router-dom';
import {
  Groups,
  Help,
  InfoOutlined,
  LeaderboardRounded,
  Logout,
  PersonAdd,
  QuestionAnswer,
  Settings
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ProfileSection } from '../ProfileSection';
import { API_URL } from '../../utils/urlConstants';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { usePrivy } from '@privy-io/react-auth';
import { DeviceInfoDialog } from '../DeviceInfoDialog';
import { useState } from 'react';

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
  const { logout } = usePrivy();

  const [openDeviceInfo, setOpenDeviceInfo] = useState(false);

  const handleShowDeviceInfo = () => {
    setOpenDeviceInfo(true);
    closeStateCallback();
  };

  const handleCloseDeviceInfo = () => {
    setOpenDeviceInfo(false);
  };

  return (
    <>
      <Menu
        {...props}
        sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
        <MenuList disablePadding>
          <MenuItem
            sx={{ minWidth: 150 }}
            onClick={async () => {
              closeStateCallback();
              navigate('/profile');
            }}>
            <ProfileSection maxWidth={150} profile={profile} />
          </MenuItem>
          <Divider />
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
              navigate('/advanced');
            }}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            Advanced
          </MenuItem>
          <MenuItem
            onClick={async () => {
              closeStateCallback();
              navigate('/leaderboard');
            }}>
            <ListItemIcon>
              <LeaderboardRounded fontSize="small" />
            </ListItemIcon>
            Users
          </MenuItem>
          <Divider />
          <MenuItem component="a" href="https://warpcast.com/~/inbox/create/19129" target="_blank">
            <ListItemIcon>
              <QuestionAnswer fontSize="small" />
            </ListItemIcon>
            Contact
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
              <Help fontSize="small" />
            </ListItemIcon>
            FAQ
          </MenuItem>
          <MenuItem onClick={handleShowDeviceInfo}>
            <ListItemIcon>
              <InfoOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>Device Info</ListItemText>
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
        </MenuList>
      </Menu>

      <DeviceInfoDialog open={openDeviceInfo} onClose={handleCloseDeviceInfo} />
    </>
  );
}
