import {
  AvatarGroup,
  Box,
  Button,
  Card,
  CardProps,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import { Send, Toll, Share, CallReceived } from '@mui/icons-material';
import { useContext, useEffect, useMemo, useState } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { BalanceFetchResultType } from '../../types/BalanceFetchResultType';
import { WalletsInfoPopover } from '../menu/WalletsInfoPopover';
import { FlowType } from '../../types/FlowType';
import { ChooseFlowMenu } from '../menu/ChooseFlowMenu';
import { FlowTopUpMenu } from '../menu/FlowTopUpMenu';
import WalletQRCodeShareDialog from '../dialogs/WalletQRCodeShareDialog';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { useAccount } from 'wagmi';
import SearchIdentityDialog from '../dialogs/SearchIdentityDialog';
import { IdentityType, SelectedIdentityType } from '../../types/ProfileType';
import PaymentDialog, { PaymentSenderType } from '../dialogs/PaymentDialog';
import { Address } from 'viem';
import { useSearchParams } from 'react-router-dom';
import { ShareFlowMenu } from '../menu/ShareFlowMenu';
import { PaymentType } from '../../types/PaymentType';
import { fetchPayment } from '../../services/payments';
import GiftStorageDialog from '../dialogs/GiftStorageDialog';
import { GetFarcasterProfileQuery, Social } from '../../generated/graphql/types';
import { QUERY_FARCASTER_PROFILE } from '../../utils/airstackQueries';
import { fetchQuery } from '@airstack/airstack-react';
import { PaymentFlowSection } from '../PaymentFlowSection';

export type AccountNewDialogProps = CardProps & {
  flows: FlowType[];
  selectedFlow: FlowType;
  setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  assetBalancesResult: BalanceFetchResultType;
  /* assetsOrActivityView: 'assets' | 'activity';
  setAssetsOrActivityView: React.Dispatch<React.SetStateAction<'assets' | 'activity'>>; */
};

export function AccountCard({
  flows,
  selectedFlow,
  setSelectedFlow,
  /*  assetsOrActivityView,
  setAssetsOrActivityView, */
  assetBalancesResult: { isLoading, isFetched, balances }
}: AccountNewDialogProps) {
  const { profile } = useContext(ProfileContext);

  const [searchParams] = useSearchParams();
  const paymentRefId = searchParams.get('pay');

  const [payment, setPayment] = useState<PaymentType>();
  // TODO: hack, return in payments from back-end instead
  const [paymentSocial, setPaymentSocial] = useState<Social>();

  const [openSearchIdentity, setOpenSearchIdentity] = useState<boolean>(false);
  const [openWalletDetailsPopover, setOpenWalletDetailsPopover] = useState(false);
  const [openSelectFlow, setOpenSelectFlow] = useState(false);
  const [openTopUpMenu, setOpenTopUpMenu] = useState(false);
  const [openShareMenu, setOpenShareMenu] = useState(false);

  const [openFlowReceiveQRCode, setOpenFlowReceiveQRCode] = useState(false);

  const [walletAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);
  const [flowAnchorEl, setFlowAnchorEl] = useState<null | HTMLElement>(null);
  const [topUpMenuAnchorEl, setTopUpMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [shareMenuAnchorEl, setShareMenuAnchorEl] = useState<null | HTMLElement>(null);

  const [totalBalance, setTotalBalance] = useState<string>();

  const [paymentType, setPaymentType] = useState<PaymentSenderType>();
  const [recipient, setRecipient] = useState<SelectedIdentityType>();

  const { chain, address } = useAccount();

  useMemo(async () => {
    if (isFetched && balances && balances.length > 0) {
      const totalBalance = balances
        .filter((balance) => balance.balance)
        .reduce((previousValue, currentValue) => {
          return previousValue + currentValue.usdValue;
        }, 0)
        .toFixed(1);

      setTotalBalance(totalBalance);
    }
  }, [isFetched, balances]);

  useEffect(() => {
    const fetchData = async () => {
      if (paymentRefId && !payment) {
        try {
          // Fetch payment data
          const paymentData = await fetchPayment(paymentRefId);
          if (paymentData) {
            if (paymentData.receiverFid) {
              // Fetch Farcaster profile data
              const { data } = await fetchQuery<GetFarcasterProfileQuery>(
                QUERY_FARCASTER_PROFILE,
                { fid: paymentData.receiverFid.toString() },
                { cache: true }
              );

              // Update social information if available
              const social = data?.Socials?.Social?.[0];
              if (social) {
                setPaymentSocial(social as Social);
              }
            }
            // Update payment state
            setPayment(paymentData);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchData();
  }, [paymentRefId, payment]);

  return (
    profile && (
      <Card
        elevation={5}
        sx={{
          m: 2,
          p: 2,
          width: 350,
          height: 200,
          border: 1.5,
          borderColor: 'divider',
          borderRadius: 5,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
        <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="center">
          <Tooltip
            title={selectedFlow.type === 'FARCASTER_VERIFICATION' ? 'Wallets' : 'Smart Wallets'}>
            <AvatarGroup
              max={4}
              color="inherit"
              total={selectedFlow.wallets.length}
              component={Button}
              sx={{
                alignSelf: 'center',
                height: 36,
                minWidth: 36,
                '& .MuiAvatar-root': {
                  borderStyle: 'none',
                  border: 0,
                  width: 20,
                  height: 20,
                  fontSize: 10
                },
                p: 1,
                pl: 2,
                border: 1,
                borderStyle: 'dashed',
                borderRadius: 5
              }}
              onClick={(event) => {
                setWalletAnchorEl(event.currentTarget);
                setOpenWalletDetailsPopover(true);
              }}>
              {[...Array(Math.min(4, selectedFlow.wallets.length))].map((_item, i) => (
                <NetworkAvatar
                  key={`account_card_wallet_list_${selectedFlow.wallets[i].network}`}
                  chainId={selectedFlow.wallets[i].network}
                />
              ))}
            </AvatarGroup>
          </Tooltip>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PaymentFlowSection navigation flow={selectedFlow} />
            <Stack
              spacing={1}
              direction="row"
              alignItems="center"
              sx={{ p: 0, border: 1, borderStyle: 'dashed', borderRadius: 5 }}>
              <Tooltip title="Payment Flows">
                <IconButton
                  size="medium"
                  onClick={(event) => {
                    setFlowAnchorEl(event.currentTarget);
                    setOpenSelectFlow(true);
                  }}>
                  <Toll fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>
        <Divider
          flexItem
          sx={{
            '&::before, &::after': {
              borderColor: 'inherit'
            }
          }}>
          <Box
            sx={{
              p: 1,
              border: 1,
              borderRadius: 5,
              minWidth: 100,
              maxWidth: 150,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            {isLoading || !totalBalance ? (
              <Skeleton variant="rectangular" height={40} width={80} sx={{ borderRadius: 3 }} />
            ) : (
              <Typography variant="h4">${isFetched ? totalBalance : 'N/A'}</Typography>
            )}
          </Box>
        </Divider>
        <Stack spacing={1} direction="row" alignSelf="center">
          <Tooltip title="Receive funds">
            <IconButton
              color="inherit"
              onClick={(event) => {
                setTopUpMenuAnchorEl(event.currentTarget);
                setOpenTopUpMenu(true);
              }}
              sx={{ border: 1, borderStyle: 'dashed' }}>
              <CallReceived />
            </IconButton>
          </Tooltip>
          <Tooltip title="Send">
            <IconButton
              color="inherit"
              onClick={async () => {
                setOpenSearchIdentity(true);
              }}
              sx={{ border: 1, borderStyle: 'dashed' }}>
              <Send />
            </IconButton>
          </Tooltip>
          {/* <Tooltip title={assetsOrActivityView === 'assets' ? ' Activity' : 'Assets'}>
            <IconButton
              color="inherit"
              onClick={() => {
                setAssetsOrActivityView(assetsOrActivityView === 'assets' ? 'activity' : 'assets');
              }}
              sx={{ border: 1, borderStyle: 'dashed' }}>
              {assetsOrActivityView === 'assets' ? <Receipt /> : <AccountBalance />}
            </IconButton>
          </Tooltip> */}
          <Tooltip title="Share">
            <IconButton
              color="inherit"
              onClick={(event) => {
                setShareMenuAnchorEl(event.currentTarget);
                setOpenShareMenu(true);
              }}
              sx={{ border: 1, borderStyle: 'dashed' }}>
              <Share />
            </IconButton>
          </Tooltip>
        </Stack>
        {recipient && selectedFlow && (
          <PaymentDialog
            open={recipient != null}
            paymentType={paymentType}
            sender={{
              type: paymentType === 'payflow' ? 'profile' : 'address',
              identity: {
                address:
                  paymentType === 'payflow'
                    ? profile.identity
                    : (address?.toLowerCase() as Address),
                ...(paymentType === 'payflow' && {
                  profile: { ...profile, defaultFlow: selectedFlow }
                })
              }
            }}
            recipient={recipient}
            setOpenSearchIdentity={setOpenSearchIdentity}
            flows={flows}
            selectedFlow={selectedFlow}
            setSelectedFlow={setSelectedFlow}
            closeStateCallback={async () => {
              setRecipient(undefined);
            }}
          />
        )}

        {profile &&
          selectedFlow &&
          payment &&
          payment.status === 'PENDING' &&
          (!payment.category ? (
            <PaymentDialog
              open={payment != null}
              paymentType="payflow"
              payment={payment}
              sender={{
                identity: {
                  profile: { ...profile, defaultFlow: selectedFlow },
                  address: profile.identity
                },
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
                setPayment(undefined);
              }}
              flows={flows}
              selectedFlow={selectedFlow}
              setSelectedFlow={setSelectedFlow}
            />
          ) : (
            payment.category === 'fc_storage' &&
            paymentSocial && (
              <GiftStorageDialog
                open={payment != null}
                payment={payment}
                sender={{
                  identity: {
                    profile: { ...profile, defaultFlow: selectedFlow },
                    address: profile.identity
                  },
                  type: 'profile'
                }}
                social={paymentSocial}
                closeStateCallback={async () => {
                  setPayment(undefined);
                  setPaymentSocial(undefined);
                }}
                flows={flows}
                selectedFlow={selectedFlow}
                setSelectedFlow={setSelectedFlow}
              />
            )
          ))}

        {openSearchIdentity && (
          <SearchIdentityDialog
            address={profile.identity}
            open={openSearchIdentity}
            closeStateCallback={async () => {
              setOpenSearchIdentity(false);
            }}
            selectIdentityCallback={async (recipient) => {
              setPaymentType('payflow');
              setRecipient(recipient);
            }}
          />
        )}

        <WalletsInfoPopover
          open={openWalletDetailsPopover}
          onClose={async () => setOpenWalletDetailsPopover(false)}
          anchorEl={walletAnchorEl}
          flow={selectedFlow}
          balanceFetchResult={{ isLoading, isFetched, balances }}
        />
        <ChooseFlowMenu
          anchorEl={flowAnchorEl}
          open={openSelectFlow}
          closeStateCallback={() => setOpenSelectFlow(false)}
          flows={flows}
          selectedFlow={selectedFlow}
          setSelectedFlow={setSelectedFlow}
        />
        <FlowTopUpMenu
          anchorEl={topUpMenuAnchorEl}
          open={openTopUpMenu}
          depositClickCallback={() => {
            setPaymentType('wallet');
            setRecipient({ type: 'profile', identity: { profile } as IdentityType });
          }}
          qrClickCallback={() => setOpenFlowReceiveQRCode(true)}
          onClose={() => setOpenTopUpMenu(false)}
          onClick={() => setOpenTopUpMenu(false)}
        />
        <ShareFlowMenu
          profile={profile}
          selectedFlow={selectedFlow}
          anchorEl={shareMenuAnchorEl}
          open={openShareMenu}
          onClose={() => setOpenShareMenu(false)}
          onClick={() => setOpenShareMenu(false)}
        />
        <WalletQRCodeShareDialog
          open={openFlowReceiveQRCode}
          wallet={
            selectedFlow.wallets.find((w) => w.network === chain?.id) ?? selectedFlow.wallets[0]
          }
          wallets={selectedFlow.wallets}
          closeStateCallback={() => setOpenFlowReceiveQRCode(false)}
        />
      </Card>
    )
  );
}
