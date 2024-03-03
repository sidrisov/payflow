import { ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { ProfileType } from '../../types/ProfleType';
import { Add, AddCircle, Link, QrCode } from '@mui/icons-material';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { DAPP_URL } from '../../utils/urlConstants';
import { toast } from 'react-toastify';

export function FlowTopUpMenu({
  profile,
  qrClickCallback,
  depositClickCallback,
  ...props
}: MenuProps & {
  profile: ProfileType;
  qrClickCallback: () => void;
  depositClickCallback: () => void;
}) {
  return (
    <Menu
      {...props}
      sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5 } }}
      style={{ borderRadius: '50px' }}
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
      <MenuItem
        onClick={() => {
          copyToClipboard(`${DAPP_URL}/${profile.username}`);
          toast.success('Profile link copied!');
        }}>
        <ListItemIcon>
          <Link fontSize="small" />
        </ListItemIcon>
        Profile link
      </MenuItem>
      {/* <MenuItem
        onClick={() => {
          comingSoonToast();
        }}>
        <ListItemIcon>
          <Payments fontSize="small" />
        </ListItemIcon>
        Request
      </MenuItem> */}
    </Menu>
  );
}
