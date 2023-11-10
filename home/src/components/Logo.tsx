import { SvgIcon, Typography } from '@mui/material';
import { Box } from '@mui/system';
import Logo from '../assets/logo.svg?react';

export default function HomeLogo(props: any) {
  return (
    <Box
      {...props}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
      }}>
      {/*       <SvgIcon component={Logo} inheritViewBox fontSize="large" />
       */}
      <Typography ml={0.5} sx={{ fontSize: 20, fontWeight: 'bold', fontFamily: 'monospace' }}>
        payflow
      </Typography>
    </Box>
  );
}
