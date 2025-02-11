import { Container, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useContext, ReactNode } from 'react';
import { ProfileContext } from '../contexts/UserContext';
import LoadingPayflowEntryLogo from './LoadingPayflowEntryLogo';

interface PayflowPageProps {
  children: ReactNode;
  title?: string;
  pageTitle?: string;
}

export default function PayflowPage({ title, children, pageTitle }: PayflowPageProps) {
  const { isAuthenticated } = useContext(ProfileContext);

  return (
    <>
      <Helmet>
        <title> {title ? `Payflow | ${title}` : 'Payflow'} </title>
      </Helmet>
      <Container maxWidth="xs" sx={{ height: '100vh' }}>
        {isAuthenticated ? (
          <>
            {pageTitle && (
              <Typography
                variant="h6"
                fontWeight="bold"
                textAlign="center"
                sx={{
                  mb: 3,
                  pt: 3
                }}>
                {pageTitle}
              </Typography>
            )}
            {children}
          </>
        ) : (
          <LoadingPayflowEntryLogo />
        )}
      </Container>
    </>
  );
}
