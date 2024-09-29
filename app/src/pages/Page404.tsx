import { Container, Typography, Paper, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

export default function Page404() {
  const error: any = useRouteError();
  console.error(error);

  const handleTryAgain = () => {
    window.location.reload();
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={5} sx={{ mt: 8, p: 4, textAlign: 'center', borderRadius: 5 }}>
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
          <Typography variant="body1">Something went wrong.</Typography>
        )}
        <Button
          variant="contained"
          color="inherit"
          startIcon={<RefreshIcon />}
          onClick={handleTryAgain}
          sx={{ mt: 2, borderRadius: 5 }}>
          Try Again
        </Button>
      </Paper>
    </Container>
  );
}
