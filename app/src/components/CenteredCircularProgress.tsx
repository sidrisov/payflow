import { Box, CircularProgress, CircularProgressProps } from '@mui/material';

export default function CenteredCircularProgress(props: CircularProgressProps) {
  return (
    <Box
      position="absolute"
      display="flex"
      alignItems="center"
      boxSizing="border-box"
      justifyContent="center"
      sx={{ inset: 0, transform: `translateY(${-10}%)` }}>
      <CircularProgress {...props} size={30} />
    </Box>
  );
}
