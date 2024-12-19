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
import { IoChatbubbleEllipses } from 'react-icons/io5';
import { GrStorage } from 'react-icons/gr';
import { FaRegHeart } from 'react-icons/fa';
import { FcApproval } from 'react-icons/fc';
import ResponsiveDialog from '../dialogs/ResponsiveDialog';

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

  const showHiddenMenuOptions = profile.username === 'sinaver1';

  return (
    <>
      <ResponsiveDialog open={Boolean(props.open)} onClose={closeStateCallback} title="Profile">
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
          {showHiddenMenuOptions && (
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
          )}
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
          {showHiddenMenuOptions && (
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
          )}
          {showHiddenMenuOptions && (
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
          )}
          <MenuItem
            onClick={async () => {
              closeStateCallback();
              navigate('/farcaster/storage');
            }}>
            <ListItemIcon>
              <GrStorage size={20} />
            </ListItemIcon>
            Farcaster Storage
          </MenuItem>
          {/* <MenuItem
            onClick={async () => {
              closeStateCallback();
              navigate('/notifications');
            }}>
            <ListItemIcon>
              <Notifications fontSize="small" />
            </ListItemIcon>
            Notifications
          </MenuItem> */}
          <Divider />
          <MenuItem component="a" href="https://warpcast.com/~/inbox/create/19129" target="_blank">
            <ListItemIcon>
              <IoChatbubbleEllipses size={20} />
            </ListItemIcon>
            Get Support
          </MenuItem>
          <MenuItem component="a" href="https://warpcast.com/~/channel/payflow" target="_blank">
            <ListItemIcon>
              <Groups fontSize="small" />
            </ListItemIcon>
            Community
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
          {showHiddenMenuOptions && (
            <MenuItem onClick={handleShowDeviceInfo}>
              <ListItemIcon>
                <InfoOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>Device Info</ListItemText>
            </MenuItem>
          )}
          <Divider />
          <MenuItem
            onClick={() => {
              closeStateCallback();
              navigate('/payment/create?recipient=0x0dEe77c83cB8b14fA95497825dF93202AbF6ad83');
            }}>
            <ListItemIcon>
              <FaRegHeart />
            </ListItemIcon>
            Tip
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeStateCallback();
              window.open('https://hypersub.xyz/s/payflow-pro-17zbymgz59atc', '_blank');
            }}>
            <ListItemIcon>
              <FcApproval size={18} />
            </ListItemIcon>
            Payflow Pro
          </MenuItem>
          <Divider />
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
                {__BUILD_INFO__.commitHash} • {__BUILD_INFO__.buildTime}
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
      </ResponsiveDialog>

      {profile.username === 'sinaver' && (
        <DeviceInfoDialog open={openDeviceInfo} onClose={handleCloseDeviceInfo} />
      )}
    </>
  );
}
