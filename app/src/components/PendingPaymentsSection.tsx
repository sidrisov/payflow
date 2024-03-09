import { Box, Stack, StackProps, Typography, useMediaQuery, useTheme } from '@mui/material';
import { PaymentType } from '../types/PaymentType';
import { ProfileSection } from './ProfileSection';

export function PendingPaymentsSection({
  payments,
  ...props
}: { payments?: PaymentType[] } & StackProps) {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    payments && (
      <Stack p={2} direction="row" spacing={3} overflow="auto" {...props}>
        {payments.map((payment) => (
          <Box
            key={payment.referenceId}
            sx={{
              p: 1,
              border: 1,
              borderRadius: 5,
              borderColor: 'divider',
              minWidth: smallScreen ? 150 : 160,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 0.5
            }}>
            <Typography variant="subtitle2">Payment Intent</Typography>
            <ProfileSection profile={payment.receiver} />
            <Typography variant="subtitle2" fontSize={15}>
              ${payment.usdAmount} ({payment.token.toUpperCase()})
            </Typography>
          </Box>
        ))}
      </Stack>
    )
  );
}
