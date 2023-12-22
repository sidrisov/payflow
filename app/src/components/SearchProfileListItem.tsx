import { Box, Stack, Button, IconButton, Chip, Tooltip, BoxProps } from '@mui/material';
import { StarBorder } from '@mui/icons-material';
import { ProfileWithSocialsType } from '../types/ProfleType';
import { ProfileSection } from './ProfileSection';
import { AddressSection } from './AddressSection';
import { comingSoonToast } from './Toasts';
import SocialPresenceAvatar from './SocialPresenceAvatar';
import { dAppType } from '../utils/dapps';
import { useContext, useMemo, useState } from 'react';
import { ProfileContext } from '../contexts/UserContext';
import axios from 'axios';
import { API_URL } from '../utils/urlConstants';
import { toast } from 'react-toastify';
import { shortenWalletAddressLabel } from '../utils/address';
import PayflowChip from './PayflowChip';
import { lightGreen, orange } from '@mui/material/colors';

export function SearchProfileListItem(
  props: BoxProps & { profileWithSocials: ProfileWithSocialsType; view: 'address' | 'profile' }
) {
  const { profile } = useContext(ProfileContext);
  const { profileWithSocials, view } = props;
  const [disableClick, setDisableClick] = useState<boolean>(false);
  const { isAuthenticated } = useContext(ProfileContext);
  const [invited, setInvited] = useState<boolean>();

  // fetch in batch for all addresses in parent component
  useMemo(async () => {
    if (!profileWithSocials.profile) {
      const response = await axios.get(
        `${API_URL}/api/invitations/identity/${profileWithSocials.meta?.addresses[0]}`,
        { withCredentials: true }
      );

      setInvited(response.data);
    }
  }, [profileWithSocials.profile]);

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
          sx={{ borderRadius: 5, height: 60 }}>
          {view === 'profile' && profileWithSocials.profile && (
            <ProfileSection maxWidth={200} profile={profileWithSocials.profile} />
          )}

          {view === 'address' && profileWithSocials.meta && (
            <AddressSection maxWidth={200} meta={profileWithSocials.meta} />
          )}

          <Stack
            direction="column"
            spacing={0.5}
            alignItems="center"
            sx={{ minWidth: 70, maxWidth: 100 }}>
            {view === 'profile' ? (
              <PayflowChip />
            ) : (
              isAuthenticated &&
              !profileWithSocials.profile && (
                <Chip
                  size="small"
                  variant="filled"
                  label={invited ? 'invited' : 'invite'}
                  clickable={!invited}
                  onMouseEnter={() => {
                    !invited && setDisableClick(true);
                  }}
                  onMouseLeave={() => {
                    !invited && setDisableClick(false);
                  }}
                  onClick={async () => {
                    if (invited) {
                      return;
                    }

                    if (profile.identityInviteLimit === -1) {
                      comingSoonToast();
                      return;
                    }

                    if (profile.identityInviteLimit === 0) {
                      toast.warn("You don't have any invites");
                      return;
                    }

                    try {
                      await axios.post(
                        `${API_URL}/api/invitations`,
                        {
                          identityBased: profileWithSocials.meta?.addresses[0]
                        },
                        { withCredentials: true }
                      );

                      setInvited(true);

                      toast.success(
                        `${shortenWalletAddressLabel(
                          profileWithSocials.meta?.addresses[0]
                        )} is whitelisted!`
                      );
                    } catch (error) {
                      toast.error('Invitation failed!');
                    }
                  }}
                  sx={{
                    bgcolor: invited ? lightGreen.A700 : orange.A700,
                    '&:hover': { bgcolor: lightGreen.A700 }
                  }}
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
