import { Avatar, Chip, ChipProps } from '@mui/material';
import { dAppType } from '../utils/dapps';
import { shortenWalletAddressLabel } from '../utils/address';

export type SocialPresenceChipWithLinkProps = ChipProps & {
  type: dAppType;
  name?: string;
};

function getLink(dappName: dAppType, profileName?: string) {
  switch (dappName) {
    case 'xmtp':
      return `https://xmtp.chat/dm/${profileName}`;
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

  const linkRef = getLink(type, name);

  return (
    <Chip
      variant="outlined"
      avatar={<Avatar src={avatarSrc} />}
      label={type === 'address' ? shortenWalletAddressLabel(name) : type === 'xmtp' ? 'chat' : name}
      clickable
      component="a"
      href={linkRef}
      sx={{ borderColor: 'inherit', m: 0.5 }}
    />
  );
}
