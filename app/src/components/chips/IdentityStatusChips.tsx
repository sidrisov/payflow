import { Chip, ChipProps } from '@mui/material';
import { grey, lightGreen, orange } from '@mui/material/colors';
import { IdentityType } from '../../types/ProfileType';

export function PayflowChip(props: ChipProps) {
  return (
    <Chip
      {...props}
      size="small"
      variant="filled"
      label="payflow"
      sx={{ fontWeight: 'bold', color: grey[800], background: lightGreen.A700 }}
    />
  );
}

export function InvitedChip(props: ChipProps) {
  return (
    <Chip
      {...props}
      size="small"
      variant="filled"
      label="invited"
      sx={{ fontWeight: 'bold', color: grey[800], background: lightGreen.A700 }}
    />
  );
}

export function InviteChip({ identity, ...props }: { identity: IdentityType } & ChipProps) {
  return (
    <Chip
      {...props}
      size="small"
      variant="filled"
      label="invite"
      clickable
      sx={{
        bgcolor: orange.A700,
        fontWeight: 'bold',
        color: grey[800],
        '&:hover': { background: lightGreen.A700 }
      }}
    />
  );
}
