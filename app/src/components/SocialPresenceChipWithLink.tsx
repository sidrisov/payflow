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
  const avatarSrc = `/${props.type === 'address' ? 'etherscan.jpg' : props.type + '.svg'}`;

  console.log(avatarSrc);
  const linkRef = getLink(props.type, props.name);

  return (
    <Chip
      variant="outlined"
      avatar={<Avatar src={avatarSrc} />}
      label={
        props.type === 'address'
          ? shortenWalletAddressLabel(props.name)
          : props.type === 'xmtp'
          ? 'chat'
          : props.name
      }
      clickable
      component="a"
      href={linkRef}
      sx={{ borderColor: 'inherit', m: 0.5 }}
    />
  );
}
