import { Container, Typography } from '@mui/material';
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
      <title>{title ? `Payflow | ${title}` : 'Payflow'}</title>
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
