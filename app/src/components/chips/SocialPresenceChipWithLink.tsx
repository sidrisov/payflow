import { Avatar, Chip, ChipProps, IconButton, Tooltip } from '@mui/material';
import { dAppType, socialLink } from '../../utils/dapps';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { ChatActionMenu } from '../menu/ChatActionMenu';
import { useState } from 'react';
import { Chat } from '@mui/icons-material';
import { IdentityType } from '@payflow/common';

export type SocialPresenceChipWithLinkProps = ChipProps & {
  type: dAppType;
  name?: string;
};

export function SocialDirectMessageButton({ identity }: { identity: IdentityType }) {
  const [chatMenuAnchorEl, setChatMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openChatMenu, setOpenChatMenu] = useState(false);

  return (
    <>
      <Tooltip title="Message user on">
        <IconButton
          color="inherit"
          onClick={(event) => {
            setChatMenuAnchorEl(event.currentTarget);
            setOpenChatMenu(true);
          }}
          sx={{ border: 1, width: 36, height: 36 }}>
          <Chat fontSize="small" />
        </IconButton>
      </Tooltip>
      <ChatActionMenu
        identity={identity}
        anchorEl={chatMenuAnchorEl}
        open={openChatMenu}
        onClose={() => setOpenChatMenu(false)}
        onClick={() => setOpenChatMenu(false)}
      />
    </>
  );
}

export default function SocialPresenceChipWithLink(props: SocialPresenceChipWithLinkProps) {
  const { type, name } = { ...props, name: props.name?.replace('lens/@', '') };
  const avatarSrc = `/${props.type === 'address' ? 'etherscan.jpg' : props.type + '.svg'}`;
  const socialLinkRef = socialLink(type, name);
  return (
    <Chip
      variant="outlined"
      avatar={<Avatar src={avatarSrc} />}
      label={type === 'address' ? shortenWalletAddressLabel2(name) : name}
      clickable
      component="a"
      href={socialLinkRef}
      target="_blank"
      sx={{ borderColor: 'inherit', m: 0.5 }}
    />
  );
}
