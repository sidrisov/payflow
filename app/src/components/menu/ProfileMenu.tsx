import {
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  MenuProps,
  Typography
} from '@mui/material';
import { ProfileType } from '@payflow/common';
import { useNavigate } from 'react-router';
import { Groups, Logout } from '@mui/icons-material';

import axios from 'axios';
import { toast } from 'react-toastify';
import { ProfileSection } from '../ProfileSection';
import { API_URL } from '../../utils/urlConstants';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';
import { MdSecurityUpdateGood, MdSecurityUpdate } from 'react-icons/md';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { green } from '@mui/material/colors';
import { IoChatbubbleEllipses } from 'react-icons/io5';
import { FaRegHeart } from 'react-icons/fa';
import ResponsiveDialog from '../dialogs/ResponsiveDialog';
import { useMobile } from '../../utils/hooks/useMobile';

export function ProfileMenu({
  profile,
  closeStateCallback,
  loginRedirectOnLogout = true,
  ...props
}: { loginRedirectOnLogout?: boolean } & MenuProps &
  CloseCallbackType & {
    profile: ProfileType;
  }) {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const { logout } = usePrivy();

  const [needRefresh, setNeedRefresh] = useState(false);
  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      setNeedRefresh(true);
    }
  });

  return (
    <>
      <ResponsiveDialog
        {...(isMobile && { height: 500 })}
        open={Boolean(props.open)}
        onClose={closeStateCallback}
        title="Profile">
        <MenuList
          disablePadding
          sx={{
            alignItems: 'flex-start',
            '& .MuiMenuItem-root': {
              '&:hover': {
                borderRadius: 3
              }
            },
            width: '100%'
          }}>
          <MenuItem
            sx={{ minWidth: 150 }}
            onClick={async () => {
              closeStateCallback();
              navigate('/profile');
            }}>
            <ProfileSection maxWidth={150} profile={profile} />
          </MenuItem>
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
    </>
  );
}
