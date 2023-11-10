import { Box, Stack, Button, IconButton, Chip, Tooltip, BoxProps } from '@mui/material';
import { StarBorder } from '@mui/icons-material';
import { ProfileWithSocialsType } from '../types/ProfleType';
import { ProfileSection } from './ProfileSection';
import { AddressSection } from './AddressSection';
import { comingSoonToast } from './Toasts';
import SocialPresenceAvatar from './SocialPresenceAvatar';
import { dAppType } from '../utils/dapps';
import { useState } from 'react';

export function SearchProfileListItem(
  props: BoxProps & { profileWithSocials: ProfileWithSocialsType; view: 'address' | 'profile' }
) {
  const { profileWithSocials, view } = props;
  const [disableClick, setDisableClick] = useState<boolean>(false);

  return (
    (view === 'profile' ? profileWithSocials.profile : profileWithSocials.meta) && (
      <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="center">
        <Box
          color="inherit"
          p={1}
          flexGrow={1}
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          component={Button}
          textTransform="none"
          onClick={!disableClick ? props.onClick : undefined}
          sx={{ borderRadius: 5, border: 0, height: 60 }}>
          {view === 'profile' && profileWithSocials.profile && (
            <ProfileSection profile={profileWithSocials.profile} />
          )}

          {view === 'address' && profileWithSocials.meta && (
            <AddressSection meta={profileWithSocials.meta} />
          )}

          <Stack direction="column" spacing={0.5} alignItems="center" sx={{ width: 70 }}>
            {view === 'profile' ? (
              <Chip
                size="small"
                variant="filled"
                label="payflow"
                sx={{ background: 'lightgreen' }}
              />
            ) : (
              !profileWithSocials.profile && (
                <Chip
                  size="small"
                  variant="filled"
                  label="invite"
                  clickable
                  onMouseEnter={() => {
                    setDisableClick(true);
                  }}
                  onMouseLeave={() => {
                    setDisableClick(false);
                  }}
                  onClick={() => {
                    comingSoonToast();
                  }}
                  sx={{ bgcolor: 'orange', '&:hover': { bgcolor: 'lightgreen' } }}
                />
              )
            )}

            {profileWithSocials.meta && (
              <Stack direction="row" spacing={0.5}>
                {profileWithSocials.meta.ens && (
                  <SocialPresenceAvatar dappName="ens" profileName={profileWithSocials.meta.ens} />
                )}
                {profileWithSocials.meta.socials
                  .filter((s) => s.profileName && s.dappName)
                  .map((s) => (
                    <SocialPresenceAvatar
                      dappName={s.dappName as dAppType}
                      profileName={s.profileName}
                    />
                  ))}
                {profileWithSocials.meta.xmtp && <SocialPresenceAvatar dappName="xmtp" />}
              </Stack>
            )}
          </Stack>
        </Box>
        <Tooltip title="Add to favourites">
          <IconButton size="small" onClick={() => comingSoonToast()}>
            <StarBorder fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    )
  );
}
