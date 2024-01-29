import { Stack, Tooltip, StackProps } from '@mui/material';
import { MetaType } from '../types/ProfleType';
import SocialPresenceAvatar from './SocialPresenceAvatar';
import { dAppType } from '../utils/dapps';
import SocialPresenceAvatarWithMeta from './SocialPresenceAvatarWithMeta';

export function SocialPresenceStack({ meta, ...props }: { meta: MetaType & StackProps }) {
  return (
    <Tooltip
      title={
        <>
          {meta.ens && <SocialPresenceAvatarWithMeta dappName="ens" profileName={meta.ens} />}
          {meta.socials.map((s) => (
            <SocialPresenceAvatarWithMeta
              dappName={s.dappName as dAppType}
              profileName={s.profileName}
              followerCount={s.followerCount}
            />
          ))}

          {meta.ens && <SocialPresenceAvatarWithMeta dappName="xmtp" />}
        </>
      }>
      <Stack {...props} direction="row" spacing={0.5} alignItems="center">
        {meta.ens && <SocialPresenceAvatar dappName="ens" />}
        {meta.socials &&
          meta.socials
            .filter((s) => s.profileName && s.dappName)
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
