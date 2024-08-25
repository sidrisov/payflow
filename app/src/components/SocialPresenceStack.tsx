import { Stack, StackProps, Box, Popover, Button } from '@mui/material';
import { MetaType } from '../types/ProfileType';
import SocialPresenceAvatar from './avatars/SocialPresenceAvatar';
import { FARCASTER_DAPP, LENS_DAPP, dAppType } from '../utils/dapps';
import SocialPresenceAvatarWithMeta from './avatars/SocialPresenceAvatarWithMeta';
import { useState } from 'react';

const renderSocialPresenceAvatars = ({ meta }: { meta: MetaType }) => {
  let farcasterFound = false;
  let lensFound = false;

  return (
    <>
      {meta.ens && <SocialPresenceAvatar dappName="ens" />}
      {meta.socials &&
        meta.socials
          .filter((s) => {
            if (s.profileName && s.dappName) {
              switch (s.dappName) {
                case FARCASTER_DAPP:
                  if (!farcasterFound) {
                    farcasterFound = true;
                    return true;
                  }
                  break;
                case LENS_DAPP:
                  if (!lensFound) {
                    lensFound = true;
                    return true;
                  }
                  break;
                default:
                  return true;
              }
            }
            return false;
          })
          .map((s) => (
            <SocialPresenceAvatar
              key={`social_presence_avatar_${s.dappName}_${s.profileName}`}
              dappName={s.dappName as dAppType}
            />
          ))}
      {meta.xmtp && <SocialPresenceAvatar dappName="xmtp" />}
    </>
  );
};

const renderSocialPresenceAvatarsWithMeta = ({ meta }: { meta: MetaType }) => (
  <>
    {meta.ens && <SocialPresenceAvatarWithMeta dappName="ens" profileName={meta.ens} />}
    {meta.socials &&
      meta.socials
        .filter((s) => s.profileName && s.dappName)
        .map((s) => (
          <SocialPresenceAvatarWithMeta
            key={`social_presence_avatar_${s.dappName}_${s.profileName}`}
            dappName={s.dappName as dAppType}
            profileName={s.profileName}
            followerCount={s.followerCount}
            isPowerUser={s.isFarcasterPowerUser}
          />
        ))}
    {meta.xmtp && <SocialPresenceAvatarWithMeta dappName="xmtp" />}
  </>
);

export function SocialPresenceStack({ meta, ...props }: { meta: MetaType & StackProps }) {
  const [openSocialPresencePopover, setOpenSocialPresencePopover] = useState(false);
  const [socialPresencePopoverAnchorEl, setSocialPresencePopoverAnchorEl] =
    useState<null | HTMLElement>(null);

  return (
    <>
      <Stack
        {...props}
        direction="row"
        spacing={0.5}
        alignItems="center"
        component={Button}
        borderRadius={5}
        onClick={async (event) => {
          setSocialPresencePopoverAnchorEl(event.currentTarget);
          setOpenSocialPresencePopover(true);
        }}>
        {renderSocialPresenceAvatars({ meta })}
      </Stack>
      <Popover
        open={openSocialPresencePopover}
        anchorEl={socialPresencePopoverAnchorEl}
        onClose={async () => {
          setOpenSocialPresencePopover(false);
        }}
        sx={{
          zIndex: 1450,
          '& .MuiPaper-root': {
            borderRadius: 5
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}>
        <Box p={1.5}>{renderSocialPresenceAvatarsWithMeta({ meta })}</Box>
      </Popover>
    </>
  );
}
