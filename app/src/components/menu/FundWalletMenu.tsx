import {
  ListItemIcon,
  Menu,
  MenuItem,
  MenuList,
  MenuProps
} from '@mui/material';
import { QrCode } from '@mui/icons-material';
import { IoWallet } from 'react-icons/io5';

export function FundWalletMenu({
  qrClickCallback,
  depositClickCallback,
  ...props
}: MenuProps & {
  qrClickCallback: () => void;
  depositClickCallback: () => void;
}) {
  return (
    <Menu
      {...props}
      sx={{
        mt: 1,
        '& .MuiList-root': {
          p: 0
        },
        '& .MuiMenuItem-root': {
          borderRadius: 0
        }
      }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
      <MenuList dense disablePadding>
        <MenuItem onClick={depositClickCallback}>
          <ListItemIcon>
            <IoWallet />
          </ListItemIcon>
          With Wallet
        </MenuItem>
        <MenuItem onClick={qrClickCallback}>
          <ListItemIcon>
            <QrCode />
          </ListItemIcon>
          QR Code
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
