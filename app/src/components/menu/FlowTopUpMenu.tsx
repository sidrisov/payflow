import { ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { ProfileType } from '../../types/ProfleType';
import { Link, Payments, QrCode } from '@mui/icons-material';
import { comingSoonToast } from '../Toasts';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { DAPP_URL } from '../../utils/urlConstants';
import { toast } from 'react-toastify';

export function FlowTopUpMenu({
  profile,
  qrClickCallback,
  ...props
}: MenuProps & {
  profile: ProfileType;
  qrClickCallback: () => void;
}) {
  return (
    <Menu
      {...props}
      sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5 } }}
      style={{ borderRadius: '50px' }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
      <MenuItem onClick={qrClickCallback}>
        <ListItemIcon>
          <QrCode fontSize="small" />
        </ListItemIcon>
        QR
      </MenuItem>
      <MenuItem
        onClick={() => {
          copyToClipboard(`${DAPP_URL}/${profile.username}`);
          toast.success('Profile link copied!');
        }}>
        <ListItemIcon>
          <Link fontSize="small" />
        </ListItemIcon>
        Link
      </MenuItem>
      <MenuItem
        onClick={() => {
          comingSoonToast();
        }}>
        <ListItemIcon>
          <Payments fontSize="small" />
        </ListItemIcon>
        Request
      </MenuItem>
    </Menu>
  );
}
