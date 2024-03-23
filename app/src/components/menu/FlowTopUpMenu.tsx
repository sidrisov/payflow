import { Avatar, ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { ProfileType } from '../../types/ProfleType';
import { AddCircle, FilterFrames, Person, QrCode } from '@mui/icons-material';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { DAPP_URL, FRAMES_URL } from '../../utils/urlConstants';
import { toast } from 'react-toastify';
import { FlowType } from '../../types/FlowType';

export function FlowTopUpMenu({
  profile,
  selectedFlow,
  qrClickCallback,
  depositClickCallback,
  ...props
}: MenuProps & {
  profile: ProfileType;
  selectedFlow: FlowType;
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

      {selectedFlow && selectedFlow.uuid === profile.defaultFlow?.uuid && (
        <MenuItem
          onClick={() => {
            copyToClipboard(`${DAPP_URL}/${profile.username}`);
            toast.success('Profile link copied!');
          }}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile link
        </MenuItem>
      )}

      {selectedFlow && selectedFlow.type === 'JAR' && (
        <MenuItem
          onClick={() => {
            const link = `${DAPP_URL}/jar/${selectedFlow.uuid}`;
            copyToClipboard(link);
            toast.success('Jar link copied!');
          }}
          sx={{ fontSize: '10' }}>
          <ListItemIcon>
            <Avatar src="/jar.png" sx={{ width: 20, height: 20 }} />
          </ListItemIcon>
          Jar link
        </MenuItem>
      )}

      {selectedFlow && (
        <MenuItem
          onClick={() => {
            const isJar = selectedFlow.type === 'JAR';
            const link = isJar
              ? `${FRAMES_URL}/jar/${selectedFlow.uuid}`
              : `${FRAMES_URL}/${profile.username}`;

            copyToClipboard(link);
            toast.success('Frame link copied!');
          }}>
          <ListItemIcon>
            <FilterFrames fontSize="small" />
          </ListItemIcon>
          Frame link
        </MenuItem>
      )}
    </Menu>
  );
}
