import { Stack, Tooltip, StackProps } from '@mui/material';
import { MetaType } from '../types/ProfleType';
import SocialPresenceAvatar from './avatars/SocialPresenceAvatar';
import { FARCASTER_DAPP, LENS_DAPP, dAppType } from '../utils/dapps';
import SocialPresenceAvatarWithMeta from './avatars/SocialPresenceAvatarWithMeta';

export function SocialPresenceStack({ meta, ...props }: { meta: MetaType & StackProps }) {
  let farcasterFound = false;
  let lensFound = false;

  return (
    <Tooltip
      arrow
      disableFocusListener
      enterDelay={50}
      enterTouchDelay={300}
      title={
        <>
          {meta.ens && <SocialPresenceAvatarWithMeta dappName="ens" profileName={meta.ens} />}
          {meta.socials &&
            meta.socials
              .filter((s) => s.profileName && s.dappName)
              .map((s) => (
                <SocialPresenceAvatarWithMeta
                  dappName={s.dappName as dAppType}
                  profileName={s.profileName}
                  followerCount={s.followerCount}
                  isPowerUser={s.isFarcasterPowerUser}
                />
              ))}

          {meta.xmtp && <SocialPresenceAvatarWithMeta dappName="xmtp" />}
        </>
      }>
      <Stack {...props} direction="row" spacing={0.5} alignItems="center">
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
      </Stack>
    </Tooltip>
  );
}
