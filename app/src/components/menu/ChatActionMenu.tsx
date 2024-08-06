import { Avatar, ListItemIcon, Menu, MenuItem, MenuList, MenuProps } from '@mui/material';
import { ChatAppType as ChatAppType, FARCASTER_DAPP } from '../../utils/dapps';
import { useEnsAddress } from 'wagmi';
import { isAddress } from 'viem';
import { IdentityType } from '../../types/ProfileType';

function getChatAppDmLink(chatApp: ChatAppType, userId: string) {
  switch (chatApp) {
    case 'warpcast':
      return `https://warpcast.com/~/inbox/create/${userId}`;
    case 'converse':
      return `https://converse.xyz/dm/${userId}`;
    case 'inbox':
      return `https://xmtp.chat/dm/${userId}`;
    case 'coinbase':
      return `https://go.cb-w.com/message?address=${userId}`;
  }
}

export function ChatActionMenu({
  identity,
  ...props
}: MenuProps & {
  identity: IdentityType;
}) {
  // TODO: small hack for coinbase wallet not supporting ens names

  const addressOrEns = identity.meta?.ens ?? identity.address;
  const { isSuccess: isEnsSuccess, data: addressEns } = useEnsAddress({
    name: addressOrEns,
    chainId: 1,
    query: {
      enabled: !isAddress(addressOrEns),
      staleTime: 300_000
    }
  });

  const fid = identity.meta?.socials.find(
    (s) => s.dappName === FARCASTER_DAPP && s.profileId
  )?.profileId;

  return (
    <Menu
      {...props}
      sx={{ mt: 1, '.MuiMenu-paper': { borderRadius: 5, border: 1, borderColor: 'divider' } }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
      <MenuList dense disablePadding>
        {fid && (
          <MenuItem component="a" href={getChatAppDmLink('warpcast', fid)} target="_blank">
            <ListItemIcon>
              <Avatar src="/dapps/warpcast.png" variant="rounded" sx={{ width: 24, height: 24 }} />
            </ListItemIcon>
            warpcast
          </MenuItem>
        )}
        {identity.meta?.xmtp && (
          <>
            <MenuItem
              component="a"
              href={getChatAppDmLink('converse', addressOrEns)}
              target="_blank">
              <ListItemIcon>
                <Avatar src="/xmtp_converse.png" variant="rounded" sx={{ width: 24, height: 24 }} />
              </ListItemIcon>
              converse
            </MenuItem>
            <MenuItem
              component="a"
              href={getChatAppDmLink(
                'coinbase',
                isAddress(addressOrEns)
                  ? addressOrEns
                  : isEnsSuccess && addressEns
                  ? addressEns
                  : ''
              )}
              target="_blank">
              <ListItemIcon>
                <Avatar src="/xmtp_coinbase.png" variant="rounded" sx={{ width: 24, height: 24 }} />
              </ListItemIcon>
              coinbase
            </MenuItem>
            <MenuItem component="a" href={getChatAppDmLink('inbox', addressOrEns)} target="_blank">
              <ListItemIcon>
                <Avatar src="/xmtp_inbox.png" variant="rounded" sx={{ width: 24, height: 24 }} />
              </ListItemIcon>
              inbox
            </MenuItem>
          </>
        )}
      </MenuList>
    </Menu>
  );
}
