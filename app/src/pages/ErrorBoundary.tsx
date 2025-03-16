import { Container, Typography, Paper, Button, Stack } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useRouteError, isRouteErrorResponse } from 'react-router';
import { Help } from '@mui/icons-material';

export default function ErrorBoundary() {
  const error = useRouteError();

  const handleTryAgain = () => {
    window.location.reload();
  };

  return (
    <Container maxWidth="xs" sx={{ height: '50vh' }}>
      <Paper
        elevation={5}
        sx={{
          mt: 8,
          p: 4,
          flexDirection: 'column',
          textAlign: 'center',
          justifyContent: 'center'
        }}>
        {isRouteErrorResponse(error) ? (
          <>
            <Typography variant="body1">Sorry, an unexpected error has occurred.</Typography>
            <Typography variant="h5" color="error" gutterBottom>
              {error.status}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error.statusText}
            </Typography>
            {error.data?.message && (
              <Typography variant="body2" color="text.secondary">
                {error.data.message}
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body1" fontWeight="bold">
            Something went wrong!
          </Typography>
        )}
        <Stack mt={2} direction="row" spacing={2} justifyContent="center" alignItems="center">
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={handleTryAgain}>
            Try Again
          </Button>

          <Button
            variant="text"
            color="inherit"
            startIcon={<Help />}
            href="https://warpcast.com/~/inbox/create/19129"
            target="_blank">
            Contact Support
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
