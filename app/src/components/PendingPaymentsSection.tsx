import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  StackProps,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { PaymentType } from '../types/PaymentType';
import { ProfileSection } from './ProfileSection';
import { useContext, useState } from 'react';
import { ExpandLess, ExpandMore, Payments } from '@mui/icons-material';
import TokenAvatar from './avatars/TokenAvatar';
import { getNetworkDisplayName } from '../utils/networks';
import NetworkAvatar from './avatars/NetworkAvatar';
import getTokenName from '../utils/erc20contracts';
import { SelectedIdentityType } from '../types/ProfleType';
import PaymentDialog from './dialogs/PaymentDialog';
import { ProfileContext } from '../contexts/UserContext';

export function PendingPaymentsSection({
  payments,
  ...props
}: { payments?: PaymentType[] } & StackProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expand, setExpand] = useState<boolean>(false);
  const [payment, setPayment] = useState<PaymentType>();

  const { profile } = useContext(ProfileContext);

  return (
    payments && (
      <>
        <Stack {...props} px={1} spacing={1}>
          <Box
            px={0.5}
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center">
            <Chip
              icon={<Payments fontSize="small" />}
              label="Pending payments"
              variant="outlined"
              sx={{ border: 0, fontSize: 14, fontWeight: 'bold' }}
            />
            <IconButton size="small" onClick={() => setExpand(!expand)}>
              {expand ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          {expand && (
            <Stack p={2} direction="row" spacing={3} overflow="auto">
              {payments.map((payment) => (
                <Box
                  key={payment.referenceId}
                  component={Button}
                  variant="outlined"
                  onClick={() => {
                    setPayment(payment);
                  }}
                  sx={{
                    p: 1.5,
                    border: 1,
                    borderRadius: 5,
                    borderColor: 'divider',
                    minWidth: isMobile ? 145 : 155,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    gap: 1,
                    textTransform: 'none',
                    color: 'inherit'
                  }}>
                  <Typography variant="subtitle2" fontWeight="bold" fontSize={14}>
                    Intent to pay
                  </Typography>

                  <ProfileSection profile={payment.receiver} />
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="flex-start"
                    spacing={0.5}
                    useFlexGap
                    flexWrap="wrap">
                    <Typography variant="caption" fontSize={isMobile ? 12 : 13}>
                      <b>${payment.usdAmount}</b> of
                    </Typography>
                    <Typography variant="caption" fontSize={isMobile ? 12 : 13}>
                      <b>{getTokenName(payment.token)}</b>
                    </Typography>
                    <TokenAvatar
                      tokenName={payment.token}
                      sx={{
                        width: 15,
                        height: 15
                      }}
                    />
                    <Typography variant="caption" fontSize={isMobile ? 12 : 13}>
                      on <b>{getNetworkDisplayName(payment.chainId)}</b>
                    </Typography>
                    <NetworkAvatar
                      chainId={payment.chainId}
                      sx={{
                        width: 15,
                        height: 15
                      }}
                    />
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
        {payment && profile?.defaultFlow && (
          <PaymentDialog
            open={Boolean(payment)}
            paymentType="payflow"
            payment={payment}
            sender={profile.defaultFlow}
            recipient={
              {
                identity: { profile: payment.receiver },
                type: 'profile'
              } as SelectedIdentityType
            }
            closeStateCallback={async () => {
              setPayment(undefined);
            }}
          />
        )}
      </>
    )
  );
}
