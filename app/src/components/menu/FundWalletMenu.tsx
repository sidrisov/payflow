import {
  ListItemIcon,
  Menu,
  MenuItem,
  MenuList,
  MenuProps,
  Typography,
  Stack
} from '@mui/material';
import { QrCode } from '@mui/icons-material';
import { IoMdSquare } from 'react-icons/io';
import { IoWallet } from 'react-icons/io5';

export function FundWalletMenu({
  qrClickCallback,
  depositClickCallback,
  frameClickCallback,
  ...props
}: MenuProps & {
  qrClickCallback: () => void;
  depositClickCallback: () => void;
  frameClickCallback: () => void;
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
        <MenuItem onClick={frameClickCallback}>
          <ListItemIcon>
            <IoMdSquare />
          </ListItemIcon>
          <Stack>
            Pay Me
            <Typography variant="caption" color="text.secondary" noWrap>
              Copy & embed frame
            </Typography>
          </Stack>
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
