import { IconButton, Popover, PopoverProps } from '@mui/material';
import { ProfileType } from '../../types/ProfleType';
import { PublicProfileDetails } from '../dialogs/PublicProfileDetails';
import { ArrowOutward } from '@mui/icons-material';
import { socialLink } from '../../utils/dapps';

export function PublicProfileDetailsPopover({
  profile,
  ...props
}: PopoverProps & { profile: ProfileType }) {
  return (
    <Popover
      {...props}
      sx={{
        mt: 1,
        '.MuiPopover-paper': {
          width: 250,
          maxHeight: 375,
          borderRadius: 5,
          p: 1,
          pb: 2,
          display: 'flex',
          flexDirection: 'column'
        }
      }}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
      }}>
      <IconButton
        color="inherit"
        size="small"
        href={socialLink('payflow', profile.username) ?? ''}
        target="_blank"
        sx={{ alignSelf: 'flex-end' }}>
        <ArrowOutward fontSize="small" />
      </IconButton>
      <PublicProfileDetails profile={profile} />
    </Popover>
  );
}
