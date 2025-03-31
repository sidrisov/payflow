import { Box, Stack, Typography } from '@mui/material';
import { green, grey, orange, red } from '@mui/material/colors';
import { UsageBarProps } from '@/types/storage';

export const UsageBar = ({ label, value }: UsageBarProps) => {
  return (
    <Stack alignItems="center" spacing={1} sx={{ flex: 1 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ width: '100%', bgcolor: grey.A400, borderRadius: 0.5, height: 5 }}>
        <Box
          sx={{
            width: `${value}%`,
            height: '100%',
            bgcolor: value <= 75 ? green.A700 : value <= 85 ? orange.A700 : red.A700,
            borderRadius: 0.5
          }}
        />
      </Box>
      <Typography variant="subtitle2" color="text.secondary">
        {value}%
      </Typography>
    </Stack>
  );
};
