import { Divider, ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { IdentityType } from '../../types/ProfleType';
import {
  AccountBalanceWallet,
  DarkModeOutlined,
  LightModeOutlined,
  Logout
} from '@mui/icons-material';
import { useContext } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { AddressSection } from '../AddressSection';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

export function WalletMenu({ closeStateCallback, ...props }: MenuProps & CloseCallbackType) {
  const { appSettings, setAppSettings } = useContext(ProfileContext);

  const { disconnectAsync } = useDisconnect();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  return (
    <Menu
      {...props}
      sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5 } }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
      {address ? (
        <MenuItem
          sx={{ minWidth: 150 }}
          component="a"
          href={`https://etherscan.io/address/${address}`}
          target="_blank">
          <AddressSection identity={{ address } as IdentityType} />
        </MenuItem>
      ) : (
        <MenuItem
          onClick={async () => {
            openConnectModal?.();
          }}>
          <ListItemIcon>
            <AccountBalanceWallet fontSize="small" />
          </ListItemIcon>
          Connect
        </MenuItem>
      )}
      <Divider />
      <MenuItem
        onClick={() => {
          setAppSettings({ ...appSettings, darkMode: !appSettings.darkMode });
        }}>
        <ListItemIcon>
          {appSettings.darkMode ? (
            <DarkModeOutlined fontSize="small" />
          ) : (
            <LightModeOutlined fontSize="small" />
          )}
        </ListItemIcon>
        {appSettings.darkMode ? 'Dark' : 'Light'}
      </MenuItem>
      {isConnected && (
        <div>
          <Divider />
          <MenuItem
            sx={{ color: 'red' }}
            onClick={async () => {
              await disconnectAsync();
              closeStateCallback();
            }}>
            <ListItemIcon sx={{ color: 'red' }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            Disconnect
          </MenuItem>
        </div>
      )}
    </Menu>
  );
}
