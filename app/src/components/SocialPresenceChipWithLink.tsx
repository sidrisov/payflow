import { Avatar, Chip, ChipProps, IconButton, Tooltip, Typography } from '@mui/material';
import { dAppType, socialLink } from '../utils/dapps';
import { shortenWalletAddressLabel } from '../utils/address';
import { XmtpActionMenu } from './XmtpActionMenu';
import { useState } from 'react';
import { Chat } from '@mui/icons-material';

export type SocialPresenceChipWithLinkProps = ChipProps & {
  type: dAppType;
  name?: string;
};

export default function SocialPresenceChipWithLink(props: SocialPresenceChipWithLinkProps) {
  const { type, name } = { ...props, name: props.name?.replace('lens/@', '') };

  const avatarSrc = `/${props.type === 'address' ? 'etherscan.jpg' : props.type + '.svg'}`;

  const socialLinkRef = socialLink(type, name);

  const [xmtpMenuAnchorEl, setXmtpMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openXmtpMenu, setOpenXmtpMenu] = useState(false);

  return type !== 'xmtp' ? (
    <Chip
      variant="outlined"
      avatar={<Avatar src={avatarSrc} />}
      label={type === 'address' ? shortenWalletAddressLabel(name) : name}
      clickable
      component="a"
      href={socialLinkRef}
      target="_blank"
      sx={{ borderColor: 'inherit', m: 0.5 }}
    />
  ) : (
    <>
      <Tooltip title="message on xmtp">
        <IconButton
          color="inherit"
          onClick={(event) => {
            setXmtpMenuAnchorEl(event.currentTarget);
            setOpenXmtpMenu(true);
          }}
          sx={{ border: 1, width: 36, height: 36 }}>
          <Chat fontSize="small" />
        </IconButton>
      </Tooltip>
      {/* <Chip
        variant="outlined"
        avatar={<Avatar src={avatarSrc} />}
        label=""
        clickable
        onClick={(event) => {
          setXmtpMenuAnchorEl(event.currentTarget);
          setOpenXmtpMenu(true);
        }}
        sx={{ borderColor: 'inherit', m: 0.5 }}
      /> */}
      <XmtpActionMenu
        addressOrEns={name ?? ''}
        anchorEl={xmtpMenuAnchorEl}
        open={openXmtpMenu}
        onClose={() => setOpenXmtpMenu(false)}
        onClick={() => setOpenXmtpMenu(false)}
      />
    </>
  );
}
