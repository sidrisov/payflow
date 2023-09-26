import { Container, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

export default function Profile() {
  const { userId } = useParams();

  return (
    <>
      <Helmet>
        <title> PayFlow | Profile </title>
      </Helmet>
      <Container>
        <Typography variant="h3">{userId}</Typography>
      </Container>
    </>
  );
}
