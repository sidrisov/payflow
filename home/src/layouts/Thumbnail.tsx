import { Box, Typography, Avatar, Stack } from '@mui/material';

export default function Home() {
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
      <Stack spacing={2} alignItems="center" sx={{ mb: 4, width: '100%' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src="/payflow.png"
            alt="Payflow Logo"
            sx={{ width: 100, height: 100, borderRadius: '25px' }}
          />
          <Typography
            variant="h1"
            fontWeight="bold"
            fontFamily="monospace"
            color="white"
            sx={{ fontSize: '6.5rem', lineHeight: 1 }}>
            Payflow
          </Typography>
        </Stack>
        <Typography
          variant="h2"
          fontWeight="bold"
          fontFamily="monospace"
          sx={{
            color: '#4ADE80',
            fontSize: '2.5rem',
            textAlign: 'center',
            lineHeight: 1.2,
            mt: 2
          }}>
          Onchain Social Payments
        </Typography>
      </Stack>
      <Box
        component="img"
        src="thumbnail_2.png"
        alt="Payflow UX"
        sx={{
          width: '100%',
          height: '71%',
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
