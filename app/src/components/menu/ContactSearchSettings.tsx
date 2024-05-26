import { Popover, PopoverProps, Stack, Typography } from '@mui/material';

export function ContactSearchSettings({ ...props }: PopoverProps) {
  return (
    <Popover
      {...props}
      sx={{ mt: 1, '.MuiPopover-paper': { borderRadius: 5 } }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}>
      <Stack m={2} spacing={1} direction="column">
        <Typography fontWeight="bold" fontSize={16} textAlign="start" color="grey">
          Search & Contact Settings
        </Typography>
      </Stack>
    </Popover>
  );
}
