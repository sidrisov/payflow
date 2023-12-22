import { Divider, ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { MetaType } from '../types/ProfleType';
import {
  AccountBalanceWallet,
  DarkModeOutlined,
  LightModeOutlined,
  Logout
} from '@mui/icons-material';
import { useContext } from 'react';
import { AnonymousUserContext } from '../contexts/UserContext';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { disconnect } from 'wagmi/actions';
import { AddressSection } from './AddressSection';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

export function WalletMenu({ closeStateCallback, ...props }: MenuProps & CloseCallbackType) {
  const { appSettings, setAppSettings } = useContext(AnonymousUserContext);

  const { address, isConnected } = useAccount();
  const { openConnectModal, connectModalOpen } = useConnectModal();

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
          <AddressSection meta={{ addresses: [address] } as MetaType} />
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
        <>
          <Divider />
          <MenuItem
            sx={{ color: 'red' }}
            onClick={async () => {
              await disconnect();
              closeStateCallback();
            }}>
            <ListItemIcon sx={{ color: 'red' }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            Disconnect
          </MenuItem>
        </>
      )}
    </Menu>
  );
}
