import {
  Box,
  Stack,
  Button,
  Chip,
  BoxProps} from '@mui/material';
import { IdentityType } from '../types/ProfleType';
import { ProfileSection } from './ProfileSection';
import { AddressSection } from './AddressSection';
import { comingSoonToast } from './Toasts';
import { useContext } from 'react';
import { ProfileContext } from '../contexts/UserContext';
import axios from 'axios';
import { API_URL } from '../utils/urlConstants';
import { toast } from 'react-toastify';
import { shortenWalletAddressLabel } from '../utils/address';
import PayflowChip from './PayflowChip';
import { lightGreen, orange } from '@mui/material/colors';
import { useAccount } from 'wagmi';
import { UpdateIdentityCallbackType } from './SearchIdentityDialog';
import { SocialPresenceStack } from './SocialPresenceStack';

export function SearchIdentityListItem(
  props: BoxProps &
    UpdateIdentityCallbackType & {
      identity: IdentityType;
      view: 'address' | 'profile';
    }
) {
  const { profile, isAuthenticated } = useContext(ProfileContext);
  const { identity, view, updateIdentityCallback } = props;

  const favourite = view === 'address' ? identity.favouriteAddress : identity.favouriteProfile;

  const { address } = useAccount();

  return (
    (view === 'profile' ? identity.profile : identity.meta) && (
      <Box
        m={1}
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        height={60}>
        <Box
          justifyContent="flex-start"
          width={150}
          color="inherit"
          component={Button}
          onClick={props.onClick}
          textTransform="none"
          sx={{ borderRadius: 5 }}>
          {view === 'profile' && identity.profile && (
            <ProfileSection maxWidth={200} profile={identity.profile} />
          )}

          {view === 'address' && identity.meta && (
            <AddressSection maxWidth={200} identity={identity} />
          )}
        </Box>

        <Stack direction="column" spacing={0.5} alignItems="center" sx={{ width: 100 }}>
          {view === 'profile' ? (
            <PayflowChip />
          ) : (
            isAuthenticated &&
            !identity.profile && (
              <Chip
                size="small"
                variant="filled"
                label={identity.invited ? 'invited' : 'invite'}
                clickable={!identity.invited}
                onClick={async () => {
                  if (identity.invited) {
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
                        identityBased: identity.address
                      },
                      { withCredentials: true }
                    );

                    toast.success(
                      `${
                        identity.meta?.ens
                          ? identity.meta?.ens
                          : shortenWalletAddressLabel(identity.address)
                      } is invited!`
                    );

                    updateIdentityCallback?.({
                      identity: identity,
                      view,
                      invited: true
                    });
                  } catch (error) {
                    toast.error('Invitation failed!');
                  }
                }}
                sx={{
                  bgcolor: identity.invited ? lightGreen.A700 : orange.A700,
                  '&:hover': { bgcolor: lightGreen.A700 }
                }}
              />
            )
          )}

          {identity.meta && (
            <SocialPresenceStack
              key={`social_presence_stack_${identity.address}`}
              meta={identity.meta}
            />
          )}
        </Stack>
      </Box>
    )
  );
}
