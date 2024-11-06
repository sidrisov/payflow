import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  MenuProps,
  Typography
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
import { GiTwoCoins } from 'react-icons/gi';

import { HiOutlineDownload } from 'react-icons/hi';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ProfileSection } from '../ProfileSection';
import { API_URL } from '../../utils/urlConstants';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { usePrivy } from '@privy-io/react-auth';
import { DeviceInfoDialog } from '../DeviceInfoDialog';
import { useState } from 'react';
import { SiFarcaster } from 'react-icons/si';
import { MdSecurityUpdateGood, MdSecurityUpdate } from 'react-icons/md';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { green } from '@mui/material/colors';

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
  const [needRefresh, setNeedRefresh] = useState(false);
  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      setNeedRefresh(true);
    }
  });

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
              navigate('/settings/preferred-flow');
            }}>
            <ListItemIcon>
              <HiOutlineDownload size={20} />
            </ListItemIcon>
            Preferred Flow
          </MenuItem>
          <MenuItem
            onClick={async () => {
              closeStateCallback();
              navigate('/settings/tokens');
            }}>
            <ListItemIcon>
              <GiTwoCoins size={20} />
            </ListItemIcon>
            Preferred Tokens
          </MenuItem>
          <MenuItem
            onClick={async () => {
              closeStateCallback();
              navigate('/settings/farcaster/client');
            }}>
            <ListItemIcon>
              <SiFarcaster size={20} />
            </ListItemIcon>
            Farcaster Client
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
          <Divider />
          <MenuItem onClick={handleShowDeviceInfo}>
            <ListItemIcon>
              <InfoOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>Device Info</ListItemText>
          </MenuItem>
          <MenuItem
            disableRipple={!needRefresh}
            onClick={async () => {
              if (needRefresh) {
                await updateServiceWorker(true);
              }
            }}
            sx={{
              ...(needRefresh
                ? {
                    border: 1,
                    borderColor: green.A700,
                    borderStyle: 'dashed',
                    m: 0.5,
                    p: '4px 10px',
                    borderRadius: 3
                  }
                : {
                    cursor: 'default',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  })
            }}>
            <ListItemIcon>
              {needRefresh ? <MdSecurityUpdate size={20} /> : <MdSecurityUpdateGood size={20} />}
            </ListItemIcon>
            <ListItemText>
              v{__BUILD_INFO__.version}{' '}
              {__BUILD_INFO__.vercelEnv !== 'production' && ` • ${__BUILD_INFO__.vercelEnv}`}
              <br />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {__BUILD_INFO__.commitHash} •{' '}
                {new Date(__BUILD_INFO__.buildTime).toLocaleDateString()}
              </Typography>
            </ListItemText>
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

      {profile.username === 'sinaver' && (
        <DeviceInfoDialog open={openDeviceInfo} onClose={handleCloseDeviceInfo} />
      )}
    </>
  );
}
