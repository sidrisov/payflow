import { Avatar, Stack, Typography } from '@mui/material';

export default function Logo(props: any) {
  return (
    <Stack
      {...props}
      p="5px"
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="center">
      <Avatar
        src="/payflow.png"
        alt="Payflow Logo"
        sx={{
          width: 36,
          height: 36,
          borderRadius: 3
        }}
      />

      <Typography fontSize={20} fontWeight="bold" fontFamily="monospace">
        Payflow
      </Typography>
    </Stack>
  );
}
