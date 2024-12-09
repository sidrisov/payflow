import {
  ListItemIcon,
  Menu,
  MenuItem,
  MenuList,
  MenuProps,
  Typography,
  Stack
} from '@mui/material';
import { AddCircle, QrCode } from '@mui/icons-material';
import { IoMdSquare } from 'react-icons/io';

export function FlowTopUpMenu({
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
      sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5 } }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
      <MenuList dense disablePadding>
        <MenuItem onClick={depositClickCallback}>
          <ListItemIcon>
            <AddCircle fontSize="small" />
          </ListItemIcon>
          Top up
        </MenuItem>
        <MenuItem onClick={qrClickCallback}>
          <ListItemIcon>
            <QrCode fontSize="small" />
          </ListItemIcon>
          QR code
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
