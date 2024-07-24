import { ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { AddCircle, QrCode } from '@mui/icons-material';

export function FlowTopUpMenu({
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
      sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5 } }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
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
    </Menu>
  );
}
