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
import { ExpandLess, ExpandMore, MoreHoriz, Payments } from '@mui/icons-material';
import TokenAvatar from './avatars/TokenAvatar';
import { getNetworkDisplayName } from '../utils/networks';
import NetworkAvatar from './avatars/NetworkAvatar';
import getTokenName from '../utils/erc20contracts';
import { IdentityType, SelectedIdentityType } from '../types/ProfleType';
import PaymentDialog from './dialogs/PaymentDialog';
import { AddressSection } from './AddressSection';
import { PaymentMenu } from './menu/PaymentMenu';
import GiftStorageDialog from './dialogs/GiftStorageDialog';
import { FlowType } from '../types/FlowType';
import { FarcasterProfileSection } from './FarcasterProfileSection';
import { ProfileContext } from '../contexts/UserContext';

export function PendingPaymentsSection({
  flow,
  payments,
  ...props
}: { flow: FlowType; payments?: PaymentType[] } & StackProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expand, setExpand] = useState<boolean>(false);
  const [payment, setPayment] = useState<PaymentType>();

  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openPaymentMenu, setOpenPaymentMenu] = useState(false);
  const [paymentMenuAnchorEl, setPaymentMenuAnchorEl] = useState<null | HTMLElement>(null);

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
              {payments
                .filter(
                  (payment) =>
                    payment.category === 'fc_storage' && payment.receiverFid !== undefined
                )
                .map((payment) => (
                  <Box
                    key={payment.referenceId}
                    component={Button}
                    variant="outlined"
                    onClick={() => {
                      setPayment(payment);
                      setOpenPaymentDialog(true);
                    }}
                    sx={{
                      p: 1.5,
                      border: 1,
                      borderRadius: 5,
                      borderColor: 'divider',
                      minWidth: isMobile ? 145 : 155,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      gap: 1,
                      textTransform: 'none',
                      color: 'inherit'
                    }}>
                    <Box
                      alignSelf="stretch"
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      justifyContent="space-between">
                      <Typography variant="subtitle2" fontWeight="bold" fontSize={14}>
                        Gift Storage
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPayment(payment);
                          setOpenPaymentMenu(true);
                          setPaymentMenuAnchorEl(event.currentTarget);
                        }}>
                        <MoreHoriz fontSize="small" />
                      </IconButton>
                    </Box>

                    {payment.receiverFid && <FarcasterProfileSection fid={payment.receiverFid} />}

                    <Typography
                      textAlign="start"
                      variant="subtitle2"
                      fontWeight="bold"
                      fontSize={isMobile ? 12 : 13}>
                      1 Unit of Storage
                    </Typography>
                  </Box>
                ))}
              {payments
                .filter((payment) => !payment.category)
                .map((payment) => (
                  <Box
                    key={payment.referenceId}
                    component={Button}
                    variant="outlined"
                    onClick={() => {
                      setPayment(payment);
                      setOpenPaymentDialog(true);
                    }}
                    sx={{
                      p: 1.5,
                      border: 1,
                      borderRadius: 5,
                      borderColor: 'divider',
                      minWidth: isMobile ? 145 : 155,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      gap: 1,
                      textTransform: 'none',
                      color: 'inherit'
                    }}>
                    <Box
                      alignSelf="stretch"
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      justifyContent="space-between">
                      <Typography variant="subtitle2" fontWeight="bold" fontSize={14}>
                        Intent to pay
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPayment(payment);
                          setOpenPaymentMenu(true);
                          setPaymentMenuAnchorEl(event.currentTarget);
                        }}>
                        <MoreHoriz fontSize="small" />
                      </IconButton>
                    </Box>

                    {payment.receiver ? (
                      <ProfileSection profile={payment.receiver} />
                    ) : (
                      <AddressSection identity={{ address: payment.receiverAddress }} />
                    )}
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
        {openPaymentDialog && payment && !payment.category && profile && flow && (
          <PaymentDialog
            open={openPaymentDialog}
            paymentType="payflow"
            payment={payment}
            sender={{
              identity: { profile: { ...profile, defaultFlow: flow }, address: profile.identity },
              type: 'profile'
            }}
            recipient={
              {
                identity: {
                  ...(payment.receiver
                    ? {
                        profile: {
                          ...payment.receiver,
                          ...(payment.receiverFlow && { defaultFlow: payment.receiverFlow })
                        }
                      }
                    : {
                        address: payment.receiverAddress
                      })
                } as IdentityType,
                type: payment.receiver ? 'profile' : 'address'
              } as SelectedIdentityType
            }
            closeStateCallback={async () => {
              setOpenPaymentDialog(false);
              setPayment(undefined);
            }}
          />
        )}

        {openPaymentDialog && profile && payment?.category === 'fc_storage' && (
          <GiftStorageDialog
            open={openPaymentDialog}
            sender={{
              identity: { profile: { ...profile, defaultFlow: flow }, address: profile.identity },
              type: 'profile'
            }}
            payment={payment}
            closeStateCallback={async () => {
              setOpenPaymentDialog(false);
              setPayment(undefined);
            }}
          />
        )}

        {openPaymentMenu && payment && (
          <PaymentMenu
            open={openPaymentMenu}
            payment={payment}
            anchorEl={paymentMenuAnchorEl}
            onClose={() => {
              setOpenPaymentMenu(false);
              setPayment(undefined);
            }}
            onClick={() => {
              setOpenPaymentMenu(false);
              setPayment(undefined);
            }}
          />
        )}
      </>
    )
  );
}
