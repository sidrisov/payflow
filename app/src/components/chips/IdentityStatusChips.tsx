import { Chip, ChipProps } from '@mui/material';
import { lightGreen, orange } from '@mui/material/colors';
import { IdentityType } from '../../types/ProfleType';

export function PayflowChip(props: ChipProps) {
  return (
    <Chip
      {...props}
      size="small"
      variant="filled"
      label="payflow"
      sx={{ background: lightGreen.A700 }}
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
      sx={{ background: lightGreen.A700 }}
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
        '&:hover': { bgcolor: lightGreen.A700 }
      }}
    />
  );
}
