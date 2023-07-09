import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { KeyboardCommandKeyRounded } from '@mui/icons-material';

export default function HomeLogo(props: any) {
  return (
    <Box
      {...props}
      //component={Link}
      to="/"
      sx={{
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
      }}>
      <KeyboardCommandKeyRounded sx={{}} />
      <Typography ml={0.5} sx={{ fontSize: 16, fontWeight: 'bold' }}>
        PayFlow
      </Typography>
    </Box>
  );
}
