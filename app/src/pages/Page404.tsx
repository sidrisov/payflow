import { Container } from '@mui/material';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

export default function Page404() {
  const error: any = useRouteError();
  console.error(error);

  return (
    <Container>
      {isRouteErrorResponse(error) ? (
        <div>
          <h1>Oops!</h1>
          <p>Sorry, an unexpected error has occurred.</p>
          <h2>{error.status}</h2>
          <p>{error.statusText}</p>
          {error.data?.message && <p>{error.data.message}</p>}
        </div>
      ) : (
        <div>Oops</div>
      )}
    </Container>
  );
}
