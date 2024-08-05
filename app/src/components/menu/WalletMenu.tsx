import { Divider, ListItemIcon, Menu, MenuItem, MenuList, MenuProps } from '@mui/material';
import { IdentityType } from '../../types/ProfleType';
import {
  AccountBalanceWallet,
  Logout
} from '@mui/icons-material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { AddressSection } from '../AddressSection';
import { useAccount, useDisconnect } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';

export function WalletMenu({ closeStateCallback, ...props }: MenuProps & CloseCallbackType) {
  const { disconnectAsync } = useDisconnect();
  const { address, isConnected } = useAccount();
  const { connectWallet } = usePrivy();

  return (
    <Menu
      {...props}
      sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5 } }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
              <MenuList dense disablePadding>

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
            connectWallet();
          }}>
          <ListItemIcon>
            <AccountBalanceWallet fontSize="small" />
          </ListItemIcon>
          Connect
        </MenuItem>
      )}
      <Divider />
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
      </MenuList>
    </Menu>
  );
}
