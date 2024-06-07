import { Popover, PopoverProps } from '@mui/material';
import { ProfileType } from '../../types/ProfleType';
import { PublicProfileDetails } from '../dialogs/PublicProfileDetails';

export function PublicProfileDetailsPopover({
  profile,
  ...props
}: PopoverProps & { profile: ProfileType }) {
  return (
    <Popover
      id="public-profile-popover"
      disableRestoreFocus
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
        },
        pointerEvents: 'none'
      }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}>
      <PublicProfileDetails identity={{ address: profile.identity, profile: profile }} />
    </Popover>
  );
}
