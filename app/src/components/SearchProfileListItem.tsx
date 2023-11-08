import {
  Box,
  Stack,
  Button,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  BoxProps
} from '@mui/material';
import { StarBorder } from '@mui/icons-material';
import { ProfileWithSocialsType } from '../types/ProfleType';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ProfileSection } from './ProfileSection';
import { AddressSection } from './AddressSection';

export function SearchProfileListItem(
  props: BoxProps & { profileWithSocials: ProfileWithSocialsType; view: 'address' | 'profile' }
) {
  const { profileWithSocials, view } = props;

  const navigate = useNavigate();

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
          onClick={props.onClick}
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
                  onClick={() => {
                    navigate('/invite?invitee=sinaver&code=asdf4432');
                  }}
                  sx={{ bgcolor: 'orange', '&:hover': { bgcolor: 'lightgreen' } }}
                />
              )
            )}

            {profileWithSocials.meta && (
              <Stack direction="row" spacing={0.5}>
                {profileWithSocials.meta.ens && (
                  <Tooltip title={profileWithSocials.meta.ens}>
                    <Avatar src="/ens.svg" sx={{ width: 15, height: 15 }} />
                  </Tooltip>
                )}
                {profileWithSocials.meta.socials
                  .filter((s) => s.profileName)
                  .map((s) => (
                    <Tooltip title={s.profileName}>
                      <Avatar src={`/${s.dappName}.svg`} sx={{ width: 15, height: 15 }} />
                    </Tooltip>
                  ))}
                {profileWithSocials.meta.xmtp && (
                  <Avatar src="/xmtp.svg" sx={{ width: 15, height: 15 }} />
                )}
              </Stack>
            )}
          </Stack>
        </Box>
        <Tooltip title="Add to favourites">
          <IconButton size="small" onClick={() => toast.warning('not implemented yet!')}>
            <StarBorder fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    )
  );
}
