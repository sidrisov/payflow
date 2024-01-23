import {
  Box,
  Stack,
  Button,
  IconButton,
  Chip,
  Tooltip,
  BoxProps,
  Avatar,
  Typography
} from '@mui/material';
import { HowToReg, Star, StarBorder } from '@mui/icons-material';
import { IdentityType } from '../types/ProfleType';
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
import { green, grey, lightGreen, orange, yellow } from '@mui/material/colors';
import { useAccount } from 'wagmi';
import { SetFavouriteCallbackType } from './SearchIdentityDialog';

export function SearchIdentityListItem(
  props: BoxProps &
    SetFavouriteCallbackType & {
      identity: IdentityType;
      view: 'address' | 'profile';
      favouritesEnabled?: boolean;
      favourite?: boolean;
      invited?: boolean;
    }
) {
  const { profile, isAuthenticated } = useContext(ProfileContext);
  const { identity, view, favouritesEnabled, favourite, setFavouriteCallback } = props;
  const [invited, setInvited] = useState<boolean>();

  const { address } = useAccount();
  // fetch in batch for all addresses in parent component
  useMemo(async () => {
    /* if (profile && !identity.profile) {
      const response = await axios.get(`${API_URL}/api/invitations/identity/${identity.address}`, {
        withCredentials: true
      });

      setInvited(response.data);
    } */
  }, [identity.profile, profile]);

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
                label={invited ? 'invited' : 'invite'}
                clickable={!invited}
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
                        identityBased: identity.address
                      },
                      { withCredentials: true }
                    );

                    setInvited(true);

                    toast.success(
                      `${
                        identity.meta?.ens
                          ? identity.meta?.ens
                          : shortenWalletAddressLabel(identity.address)
                      } is invited!`
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

          {identity.meta && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              {identity.meta.ens && (
                <SocialPresenceAvatar dappName="ens" profileName={identity.meta.ens} />
              )}
              {identity.meta.socials &&
                identity.meta.socials
                  .filter((s) => s.profileName && s.dappName)
                  .map((s) => (
                    <SocialPresenceAvatar
                      key={s.dappName}
                      dappName={s.dappName as dAppType}
                      profileName={s.profileName}
                      followerCount={s.followerCount}
                    />
                  ))}
              {identity.meta.xmtp && <SocialPresenceAvatar dappName="xmtp" />}
            </Stack>
          )}
        </Stack>
        <Stack spacing={1} direction="row" alignItems="center">
          <Tooltip
            title={
              profile?.identity || address ? (
                (profile?.identity ?? address) === identity.profile?.identity ? (
                  <Typography variant="caption" fontWeight="bold">
                    Your {view === 'profile' ? 'profile' : 'address'}
                  </Typography>
                ) : identity?.meta?.insights?.farcasterFollow ||
                  identity?.meta?.insights?.lensFollow ||
                  identity?.meta?.insights?.sentTxs ? (
                  <>
                    {identity.meta.insights.farcasterFollow && (
                      <Stack spacing={1} direction="row" alignItems="center">
                        <Avatar src="farcaster.svg" sx={{ width: 15, height: 15 }} />
                        <Typography variant="caption" fontWeight="bold">
                          {identity.meta.insights.farcasterFollow === 'mutual'
                            ? 'Mutual follow'
                            : 'You follow them'}
                        </Typography>
                      </Stack>
                    )}
                    {identity.meta.insights.lensFollow && (
                      <Stack spacing={1} direction="row" alignItems="center">
                        <Avatar src="lens.svg" sx={{ width: 15, height: 15 }} />
                        <Typography variant="caption" fontWeight="bold">
                          {identity.meta.insights.lensFollow === 'mutual'
                            ? 'Mutual follow'
                            : 'You follow them'}
                        </Typography>
                      </Stack>
                    )}
                    {identity.meta.insights.sentTxs > 0 && (
                      <Stack spacing={1} direction="row" alignItems="center">
                        <Avatar src="ethereum.png" sx={{ width: 15, height: 15 }} />
                        <Typography variant="caption" fontWeight="bold">
                          {`Transacted ${
                            identity.meta.insights.sentTxs === 1
                              ? 'once'
                              : (identity.meta.insights.sentTxs > 5
                                  ? '5+'
                                  : identity.meta.insights.sentTxs) + ' times'
                          }`}
                        </Typography>
                      </Stack>
                    )}
                  </>
                ) : (
                  <Typography variant="caption" fontWeight="bold">
                    No connection insights
                  </Typography>
                )
              ) : (
                <Typography variant="caption" fontWeight="bold">
                  For connection insights connect wallet
                </Typography>
              )
            }>
            <HowToReg
              sx={{
                color:
                  identity?.meta?.insights?.farcasterFollow ||
                  identity?.meta?.insights?.lensFollow ||
                  identity?.meta?.insights?.sentTxs ||
                  ((profile?.identity || address) &&
                    (profile?.identity ?? address) === identity.profile?.identity)
                    ? green.A700
                    : grey.A700,
                border: 1,
                borderRadius: 5,
                p: 0.05,
                width: 16,
                height: 16
              }}
            />
          </Tooltip>
          {favouritesEnabled && (
            <IconButton
              size="small"
              onClick={async () => {
                try {
                  await axios.post(
                    `${API_URL}/api/user/me/favourites`,
                    {
                      address: identity.address,
                      favouriteAddress: view === 'address' ? !favourite : undefined,
                      favouriteProfile: view === 'profile' ? !favourite : undefined
                    } as IdentityType,
                    { withCredentials: true }
                  );
                  setFavouriteCallback?.({
                    identity: identity,
                    view,
                    favourite: !favourite
                  });
                } catch (error) {
                  toast.error('Favourite failed!');
                }
              }}>
              {favourite ? (
                <Star fontSize="small" sx={{ color: yellow.A700 }} />
              ) : (
                <StarBorder fontSize="small" />
              )}
            </IconButton>
          )}
        </Stack>
      </Box>
    )
  );
}
