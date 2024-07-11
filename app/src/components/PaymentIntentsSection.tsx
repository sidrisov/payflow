import {
  Box,
  Button,
  ButtonProps,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  StackProps,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { PaymentType } from '../types/PaymentType';
import { ProfileSection } from './ProfileSection';
import { useContext, useState } from 'react';
import { ExpandLess, ExpandMore, MoreHoriz, Payments, Schedule } from '@mui/icons-material';
import TokenAvatar from './avatars/TokenAvatar';
import { getNetworkDisplayName } from '../utils/networks';
import NetworkAvatar from './avatars/NetworkAvatar';
import getTokenName, { ERC20_CONTRACTS, Token } from '../utils/erc20contracts';
import { IdentityType, SelectedIdentityType } from '../types/ProfleType';
import PaymentDialog from './dialogs/PaymentDialog';
import { AddressSection } from './AddressSection';
import { PaymentMenu } from './menu/PaymentMenu';
import GiftStorageDialog from './dialogs/GiftStorageDialog';
import { FlowType } from '../types/FlowType';
import { FarcasterProfileSection } from './FarcasterProfileSection';
import { ProfileContext } from '../contexts/UserContext';
import { QUERY_FARCASTER_PROFILE } from '../utils/airstackQueries';
import { useQuery } from '@airstack/airstack-react';
import { Social } from '../generated/graphql/types';
import { formatAmountWithSuffix } from '../utils/formats';
import calculateMaxPages from '../utils/pagination';

const pageSize = 5;

export function PaymentIntentsSection({
  flow,
  payments,
  ...props
}: { flow: FlowType; payments?: PaymentType[] } & StackProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expand, setExpand] = useState<boolean>(false);
  const [payment, setPayment] = useState<PaymentType>();
  const [fidSocial, setFidSocial] = useState<Social>();

  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);

  const { profile } = useContext(ProfileContext);

  const maxPages = calculateMaxPages(payments?.length ?? 0, pageSize);
  const [page, setPage] = useState<number>(1);

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
              icon={<Schedule fontSize="small" />}
              label={`Intents (${payments.length})`}
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
                .slice(0, page * pageSize)
                .map((payment, index) =>
                  payment.category === 'fc_storage' && payment.receiverFid !== undefined ? (
                    <GiftStoragePayment key={`pending_payment_${index}`} payment={payment} />
                  ) : (
                    <IntentPayment key={`pending_payment_${index}`} payment={payment} />
                  )
                )}
              {page < maxPages && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setPage(page + 1);
                  }}
                  sx={{
                    p: 3,
                    minWidth: isMobile ? 145 : 155,
                    textTransform: 'none',
                    borderRadius: 5
                  }}>
                  <Typography variant="subtitle2">More intents</Typography>
                </Button>
              )}
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

        {openPaymentDialog && profile && payment?.category === 'fc_storage' && fidSocial && (
          <GiftStorageDialog
            open={openPaymentDialog}
            sender={{
              identity: { profile: { ...profile, defaultFlow: flow }, address: profile.identity },
              type: 'profile'
            }}
            payment={payment}
            social={fidSocial}
            closeStateCallback={async () => {
              setOpenPaymentDialog(false);
              setPayment(undefined);
              setFidSocial(undefined);
            }}
          />
        )}
      </>
    )
  );

  function GiftStoragePayment({ payment, ...props }: ButtonProps & { payment: PaymentType }) {
    const [openPaymentMenu, setOpenPaymentMenu] = useState(false);
    const [paymentMenuAnchorEl, setPaymentMenuAnchorEl] = useState<null | HTMLElement>(null);

    const { data: social, loading: loadingSocials } = useQuery<Social>(
      QUERY_FARCASTER_PROFILE,
      { fid: payment.receiverFid?.toString() },
      {
        cache: true,
        dataFormatter(data) {
          return data.Socials.Social[0];
        }
      }
    );

    const numberOfUnits = payment.tokenAmount ?? 1;

    return (
      <>
        <Box
          component={Button}
          variant="text"
          onClick={() => {
            if (social) {
              setPayment(payment);
              setOpenPaymentDialog(true);
              setFidSocial(social);
            }
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
          }}
          {...props}>
          {loadingSocials || !social ? (
            <Skeleton variant="rounded" sx={{ width: '100%', height: '100%' }} />
          ) : (
            <>
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
                    setOpenPaymentMenu(true);
                    setPaymentMenuAnchorEl(event.currentTarget);
                  }}>
                  <MoreHoriz fontSize="small" />
                </IconButton>
              </Box>

              <FarcasterProfileSection social={social} />

              <Typography
                textAlign="start"
                variant="subtitle2"
                fontWeight="bold"
                fontSize={isMobile ? 12 : 13}>
                {numberOfUnits} Unit{numberOfUnits > 1 ? 's' : ''} of Storage
              </Typography>
            </>
          )}
        </Box>
        {openPaymentMenu && payment && (
          <PaymentMenu
            open={openPaymentMenu}
            payment={payment}
            anchorEl={paymentMenuAnchorEl}
            onClose={() => {
              setOpenPaymentMenu(false);
            }}
            onClick={() => {
              setOpenPaymentMenu(false);
            }}
          />
        )}
      </>
    );
  }

  function IntentPayment({ payment, ...props }: ButtonProps & { payment: PaymentType }) {
    const [openPaymentMenu, setOpenPaymentMenu] = useState(false);
    const [paymentMenuAnchorEl, setPaymentMenuAnchorEl] = useState<null | HTMLElement>(null);

    const token = ERC20_CONTRACTS.find(
      (t) => t.chainId === payment.chainId && t.id === payment.token
    );
    return (
      <>
        <Box
          component={Button}
          variant="text"
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
          }}
          {...props}>
          <Box
            alignSelf="stretch"
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            <Typography variant="subtitle2" fontWeight="bold" fontSize={14}>
              Payment
            </Typography>
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
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
              <b>
                {payment.tokenAmount
                  ? formatAmountWithSuffix(payment.tokenAmount.toString())
                  : `$${payment.usdAmount}`}
              </b>{' '}
              of
            </Typography>
            <Typography variant="caption" fontSize={isMobile ? 12 : 13}>
              <b>{getTokenName(payment.token)}</b>
            </Typography>
            <TokenAvatar
              token={token as Token}
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
        {openPaymentMenu && payment && (
          <PaymentMenu
            open={openPaymentMenu}
            payment={payment}
            anchorEl={paymentMenuAnchorEl}
            onClose={() => {
              setOpenPaymentMenu(false);
            }}
            onClick={() => {
              setOpenPaymentMenu(false);
            }}
          />
        )}
      </>
    );
  }
}
