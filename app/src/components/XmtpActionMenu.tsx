import { Avatar, ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { XmtpAppType } from '../utils/dapps';

function getXmtpAppDmLink(xmtpApp: XmtpAppType, addressOrEns: string) {
  switch (xmtpApp) {
    case 'inbox':
      return `https://xmtp.chat/dm/${addressOrEns}`;
    case 'converse':
      return `https://converse.xyz/dm/${addressOrEns}`;
    case 'coinbase':
      return `https://go.cb-w.com/message?address=${addressOrEns}`;
  }
}

export function XmtpActionMenu({
  addressOrEns,
  ...props
}: MenuProps & {
  addressOrEns: string;
}) {
  return (
    <Menu
      {...props}
      sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5, border: 1, borderColor: 'divider' } }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
      <MenuItem component="a" href={getXmtpAppDmLink('converse', addressOrEns)} target="_blank">
        <ListItemIcon>
          <Avatar src="xmtp_converse.png" variant="rounded" sx={{ width: 24, height: 24 }} />
        </ListItemIcon>
        converse
      </MenuItem>
      <MenuItem component="a" href={getXmtpAppDmLink('coinbase', addressOrEns)} target="_blank">
        <ListItemIcon>
          <Avatar src="xmtp_coinbase.png" variant="rounded" sx={{ width: 24, height: 24 }} />
        </ListItemIcon>
        coinbase
      </MenuItem>
      <MenuItem component="a" href={getXmtpAppDmLink('inbox', addressOrEns)} target="_blank">
        <ListItemIcon>
          <Avatar src="xmtp_inbox.png" variant="rounded" sx={{ width: 24, height: 24 }} />
        </ListItemIcon>
        inbox
      </MenuItem>
    </Menu>
  );
}
