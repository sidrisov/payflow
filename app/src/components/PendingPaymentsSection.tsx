import {
  Box,
  IconButton,
  Stack,
  StackProps,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { PaymentType } from '../types/PaymentType';
import { ProfileSection } from './ProfileSection';
import { useState } from 'react';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

export function PendingPaymentsSection({
  payments,
  ...props
}: { payments?: PaymentType[] } & StackProps) {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [expand, setExpand] = useState<boolean>(false);

  return (
    payments && (
      <Stack {...props} px={1} spacing={1}>
        <Box
          px={1}
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center">
          <Typography variant="subtitle2">Pending payments</Typography>
          <IconButton size="small" onClick={() => setExpand(!expand)}>
            {expand ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        {expand && (
          <Stack direction="row" spacing={3} overflow="auto">
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
        )}
      </Stack>
    )
  );
}
