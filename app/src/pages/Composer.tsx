import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Avatar, Box, Container, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { CropDin } from '@mui/icons-material';
import CastActionButton from '../components/buttons/CastActionButton';
import { useSearchParams } from 'react-router-dom';
import PaymentFrameComposerDialog from '../components/dialogs/PaymentFrameComposerDialog';

export default function Composer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');

  const [openPaymentFrameComposerDialog, setOpenPaymentFrameComposerDialog] = useState<boolean>(
    action === 'frame'
  );

  return (
    <>
      <Helmet>
        <title> Payflow | Composer Actions </title>
      </Helmet>
      <Container maxWidth="xs" sx={{ height: '100%' }}>
        <Box
          height="100%"
          display="flex"
          flexDirection="column"
          justifyContent={isMobile ? 'space-between' : 'flex-start'}
          sx={{ p: 3 }}>
          <Stack
            p={3}
            spacing={3}
            alignItems="center"
            border={1.5}
            borderRadius={5}
            borderColor="divider">
            <Avatar src="/farcaster.svg" variant="rounded" />
            <Typography variant="h6" align="center">
              Farcaster Composer Actions
            </Typography>
            <Stack spacing={1} alignItems="center">
              <CastActionButton
                title="Payment Frame"
                description="Use this composer action to create a custom payment frame"
                onClick={() => setOpenPaymentFrameComposerDialog(true)}
                startIcon={<CropDin />}
              />
            </Stack>
          </Stack>
        </Box>
      </Container>
      <PaymentFrameComposerDialog
        open={openPaymentFrameComposerDialog}
        closeStateCallback={() => {
          setOpenPaymentFrameComposerDialog(false);
        }}
        onClose={() => {
          setOpenPaymentFrameComposerDialog(false);
        }}
      />
    </>
  );
}
