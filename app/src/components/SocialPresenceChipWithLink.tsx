import { Avatar, Chip, ChipProps } from '@mui/material';
import { dAppType } from '../utils/dapps';
import { shortenWalletAddressLabel } from '../utils/address';
import { XmtpActionMenu } from './XmtpActionMenu';
import { useState } from 'react';

export type SocialPresenceChipWithLinkProps = ChipProps & {
  type: dAppType;
  name?: string;
};

function getSocialLink(dappName: dAppType, profileName?: string) {
  switch (dappName) {
    case 'ens':
    case 'address':
      return `https://etherscan.io/address/${profileName}`;
    case 'farcaster':
      return `https://warpcast.com/${profileName}`;
    case 'lens':
      return `https://hey.xyz/u/${profileName}`;
  }
}

export default function SocialPresenceChipWithLink(props: SocialPresenceChipWithLinkProps) {
  const { type, name } = { ...props, name: props.name?.replace('lens/@', '') };

  const avatarSrc = `/${props.type === 'address' ? 'etherscan.jpg' : props.type + '.svg'}`;

  const socialLinkRef = getSocialLink(type, name);

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
      <Chip
        variant="outlined"
        avatar={<Avatar src={avatarSrc} />}
        label="chat"
        clickable
        onClick={(event) => {
          setXmtpMenuAnchorEl(event.currentTarget);
          setOpenXmtpMenu(true);
        }}
        sx={{ borderColor: 'inherit', m: 0.5 }}
      />
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
