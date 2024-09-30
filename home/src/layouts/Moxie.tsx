import { Box, Typography, Avatar, Stack } from '@mui/material';

export default function Moxie() {
  return (
    <Box
      sx={{
        width: '600px',
        height: '600px',
        backgroundColor: '#7d52db',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 4,
        position: 'relative',
        overflow: 'hidden'
      }}>
      <Stack spacing={1} alignItems="center" sx={{ mb: 4, width: '100%' }}>
        <Typography
          variant="h2"
          fontWeight="bold"
          fontFamily="monospace"
          sx={{
            color: '#4ADE80',
            fontSize: '2.8rem',
            textAlign: 'center',
            lineHeight: 1.2,
            mt: 2
          }}>
          Claim <span style={{ fontSize: '3.5rem' }}>Ⓜ️</span> Moxie Rewards
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography
            variant="h1"
            fontWeight="bold"
            fontFamily="monospace"
            color="white"
            sx={{ fontSize: '4.5rem', lineHeight: 1 }}>
            on
          </Typography>
          <Avatar
            src="/payflow.png"
            alt="Payflow Logo"
            sx={{ width: 64, height: 64, borderRadius: 5 }}
          />
          <Typography
            variant="h1"
            fontWeight="bold"
            fontFamily="monospace"
            color="white"
            sx={{ fontSize: '4rem', lineHeight: 1 }}>
            Payflow
          </Typography>
        </Stack>
      </Stack>
      <Box
        component="img"
        src="moxie_ux.png"
        alt="Payflow UX"
        sx={{
          width: '90%',
          height: '72%',
          objectFit: 'cover',
          objectPosition: 'center top',
          position: 'absolute',
          bottom: 0,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16
        }}
      />
    </Box>
  );
}
