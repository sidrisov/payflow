import { Avatar, Badge, Stack, Typography } from '@mui/material';
import { ProfileType } from '@payflow/common';
import ProfileAvatar from './avatars/ProfileAvatar';
import { shortenWalletAddressLabel } from '../utils/address';
import { FlowType } from '@payflow/common';
import FarcasterAvatar from './avatars/FarcasterAvatar';
import CopyToClipboardIconButton from './buttons/CopyToClipboardIconButton';
import { Address } from 'viem';

const getWalletTypeAvatar = (type: FlowType['type'], view: 'profile' | 'flow') => {
  if (view === 'profile') {
    return <Avatar variant="rounded" src="/payflow.png" sx={{ width: 16, height: 16 }} />;
  }

  switch (type) {
    case 'BANKR':
      return <Avatar variant="rounded" src="/dapps/bankr.png" sx={{ width: 16, height: 16 }} />;
    case 'RODEO':
      return <Avatar variant="rounded" src="/dapps/rodeo.png" sx={{ width: 16, height: 16 }} />;
    case 'FARCASTER_VERIFICATION':
      return <FarcasterAvatar size={16} />;
    case 'LINKED':
    case 'REGULAR':
    default:
      return <Avatar variant="rounded" src="/payflow.png" sx={{ width: 16, height: 16 }} />;
  }
};

export function ProfileSection({
  profile,
  avatarSize,
  fontSize,
  maxWidth,
  view = 'profile',
  address,
  copy = true
}: {
  profile: ProfileType;
  avatarSize?: number;
  fontSize?: number;
  maxWidth?: number;
  view?: 'profile' | 'flow';
  address?: Address;
  copy?: boolean;
}) {
  const walletAddress = address ?? profile?.defaultFlow?.wallets[0].address;
  const walletType: FlowType['type'] = profile?.defaultFlow?.type;
  return (
    <Stack maxWidth={maxWidth ?? 130} direction="row" spacing={0.5} alignItems="center">
      <Badge
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        overlap="circular"
        badgeContent={getWalletTypeAvatar(walletType, view)}>
        <ProfileAvatar profile={profile} sx={{ width: avatarSize, height: avatarSize }} />
      </Badge>
      <Stack
        minWidth={75}
        spacing={0.1}
        alignItems="flex-start"
        sx={{
          overflowX: 'scroll',
          scrollbarWidth: 'auto', // Hide the scrollbar for firefox
          '&::-webkit-scrollbar': {
            display: 'none' // Hide the scrollbar for WebKit browsers (Chrome, Safari, Edge, etc.)
          },
          '&-ms-overflow-style:': {
            display: 'none' // Hide the scrollbar for IE
          },
          '-webkit-overflow-scrolling': 'touch' // Improve scrolling on iOS
        }}>
        <Typography noWrap variant="subtitle2" fontSize={fontSize}>
          {profile?.username}
        </Typography>
        {walletAddress && (
          <Stack direction="row" spacing={0.1} alignItems="center">
            <Typography noWrap variant="caption">
              {shortenWalletAddressLabel(walletAddress)}
            </Typography>
            {copy && <CopyToClipboardIconButton tooltip="Copy address" value={walletAddress} />}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
