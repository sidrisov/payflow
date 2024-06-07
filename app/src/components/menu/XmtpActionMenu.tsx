import { Avatar, ListItemIcon, Menu, MenuItem, MenuProps } from '@mui/material';
import { XmtpAppType } from '../../utils/dapps';
import { useEnsAddress } from 'wagmi';
import { isAddress } from 'viem';

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
  // TODO: small hack for coinbase wallet not supporting ens names
  const { isSuccess: isEnsSuccess, data: addressEns } = useEnsAddress({
    name: addressOrEns,
    chainId: 1,
    query: {
      enabled: !isAddress(addressOrEns),
      staleTime: 300_000
    }
  });

  return (
    <Menu
      {...props}
      sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5, border: 1, borderColor: 'divider' } }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
      <MenuItem component="a" href={getXmtpAppDmLink('converse', addressOrEns)} target="_blank">
        <ListItemIcon>
          <Avatar src="/xmtp_converse.png" variant="rounded" sx={{ width: 24, height: 24 }} />
        </ListItemIcon>
        converse
      </MenuItem>
      <MenuItem
        component="a"
        href={getXmtpAppDmLink(
          'coinbase',
          isAddress(addressOrEns) ? addressOrEns : isEnsSuccess && addressEns ? addressEns : ''
        )}
        target="_blank">
        <ListItemIcon>
          <Avatar src="/xmtp_coinbase.png" variant="rounded" sx={{ width: 24, height: 24 }} />
        </ListItemIcon>
        coinbase
      </MenuItem>
      <MenuItem component="a" href={getXmtpAppDmLink('inbox', addressOrEns)} target="_blank">
        <ListItemIcon>
          <Avatar src="/xmtp_inbox.png" variant="rounded" sx={{ width: 24, height: 24 }} />
        </ListItemIcon>
        inbox
      </MenuItem>
    </Menu>
  );
}
