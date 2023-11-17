import { Chip, ChipProps } from '@mui/material';
import { green, lightGreen } from '@mui/material/colors';

export default function PayflowChip(props: ChipProps) {
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
