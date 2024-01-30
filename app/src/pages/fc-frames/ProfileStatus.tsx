import { Container, Typography } from '@mui/material';
import { lightGreen } from '@mui/material/colors';
import { Helmet } from 'react-helmet-async';

export default function ProfileStatus() {
  return (
    <>
      <Helmet>
        <title> Payflow | Check Status </title>
        <meta property="fc:frame:button:1" content="Check" />
      </Helmet>
      <Container maxWidth="sm">
        <Typography variant="h3" color={lightGreen.A700} fontWeight="bold">
          Check Your Payflow Status
        </Typography>
      </Container>
    </>
  );
}
