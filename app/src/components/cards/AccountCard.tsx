import {
  Box,
  Card,
  CardProps,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  SxProps
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useContext, useMemo, useState, useCallback, useRef, lazy, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { TbSelector, TbSend, TbPlus, TbSwitch } from 'react-icons/tb';
import { useSwipeable } from 'react-swipeable';
import { Visibility, VisibilityOff } from '@mui/icons-material';

import { ProfileContext } from '../../contexts/UserContext';
import { BalanceFetchResultType } from '../../types/BalanceFetchResultType';
import { FlowType, IdentityType, SelectedIdentityType } from '@payflow/common';
import { ChooseFlowDialog } from '../dialogs/ChooseFlowDialog';
import { FlowTopUpMenu } from '../menu/FlowTopUpMenu';
import WalletQRCodeShareDialog from '../dialogs/WalletQRCodeShareDialog';
import SearchIdentityDialog from '../dialogs/SearchIdentityDialog';
import { ShareFlowMenu } from '../menu/ShareFlowMenu';
import { PaymentFlowSection } from '../PaymentFlowSection';
import { formatAmountWithSuffix } from '../../utils/formats';
import { ActionButton } from '../buttons/ActionButton';
import { PayMeDialog } from '../dialogs/PayMeDialog';
import { GoArrowSwitch } from 'react-icons/go';
import { HiOutlineSwitchHorizontal } from 'react-icons/hi';

const LazyPaymentDialog = lazy(() => import('../payment/PaymentDialog'));

const nonSelectableText: SxProps = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none'
};

export type AccountCardProps = CardProps & {
  flows: FlowType[];
  selectedFlow: FlowType;
  setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType>>;
  assetBalancesResult: BalanceFetchResultType;
  balanceVisible: boolean;
  setBalanceVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

export function AccountCard({
  flows,
  selectedFlow,
  setSelectedFlow,
  assetBalancesResult: { isLoading, isFetched, balances },
  balanceVisible,
  setBalanceVisible
}: AccountCardProps) {
  const { profile } = useContext(ProfileContext);

  const [openSearchIdentity, setOpenSearchIdentity] = useState<boolean>(false);
  const [openSelectFlow, setOpenSelectFlow] = useState(false);
  const [openTopUpMenu, setOpenTopUpMenu] = useState(false);
  const [openShareMenu, setOpenShareMenu] = useState(false);
  const [openPayMeDialog, setOpenPayMeDialog] = useState(false);

  const [openFlowReceiveQRCode, setOpenFlowReceiveQRCode] = useState(false);

  const [topUpMenuAnchorEl, setTopUpMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [shareMenuAnchorEl, setShareMenuAnchorEl] = useState<null | HTMLElement>(null);

  const [totalBalance, setTotalBalance] = useState<string>();

  const [paymentType, setPaymentType] = useState<any>();
  const [recipient, setRecipient] = useState<SelectedIdentityType>();

  const { address } = useAccount();

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedVisibility = localStorage.getItem('payflow:balance:visible');
    if (savedVisibility !== null) {
      setBalanceVisible(savedVisibility === 'true');
    }
  }, [setBalanceVisible]);

  const handleBalanceVisibilityToggle = useCallback(() => {
    setBalanceVisible((prev) => {
      const newValue = !prev;
      localStorage.setItem('payflow:balance:visible', String(newValue));
      return newValue;
    });
  }, [setBalanceVisible]);

  const handleBalanceMouseDown = useCallback(() => {
    holdTimerRef.current = setTimeout(() => {
      handleBalanceVisibilityToggle();
    }, 500); // Hold for 500ms to toggle
  }, [handleBalanceVisibilityToggle]);

  const handleBalanceMouseUp = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
  }, []);

  useMemo(() => {
    if (isFetched && balances && balances.length > 0) {
      const total = balances
        .filter((balance) => balance.balance)
        .reduce((sum, current) => sum + current.usdValue, 0)
        .toFixed(1);
      setTotalBalance(formatAmountWithSuffix(total));
    }
  }, [isFetched, balances]);

  const handleReceive = (event: React.MouseEvent<HTMLElement>) => {
    setTopUpMenuAnchorEl(event.currentTarget);
    setOpenTopUpMenu(true);
  };

  const handleSend = async () => {
    setOpenSearchIdentity(true);
  };

  const handleShare = (event: React.MouseEvent<HTMLElement>) => {
    setShareMenuAnchorEl(event.currentTarget);
    setOpenShareMenu(true);
  };

  const handleSwipe = (direction: 'LEFT' | 'RIGHT') => {
    const totalFlows = orderedFlows.length;
    let newIndex;
    if (direction === 'LEFT') {
      newIndex = (currentIndex + 1) % totalFlows;
    } else {
      newIndex = (currentIndex - 1 + totalFlows) % totalFlows;
    }
    setSelectedFlow(orderedFlows[newIndex]);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('LEFT'),
    onSwipedRight: () => handleSwipe('RIGHT'),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  const separateFlows = (flows: FlowType[]) => {
    const regular = flows.filter(
      (flow) =>
        !flow.archived &&
        flow.wallets.length > 0 &&
        !flow.wallets.some((w) => w.version === '1.3.0') &&
        flow.type !== 'FARCASTER_VERIFICATION'
    );
    const farcaster = flows.filter(
      (flow) => !flow.archived && flow.type === 'FARCASTER_VERIFICATION'
    );
    const legacy = flows.filter(
      (flow) =>
        !flow.archived && flow.wallets.length > 0 && flow.wallets.some((w) => w.version === '1.3.0')
    );
    return [...regular, ...farcaster, ...legacy];
  };

  const orderedFlows = useMemo(() => separateFlows(flows), [flows]);
  const currentIndex = orderedFlows.findIndex((flow) => flow.uuid === selectedFlow.uuid);

  return (
    profile && (
      <>
        <Card
          elevation={5}
          sx={{
            m: 2,
            pt: 2,
            pb: 2.5,
            px: 2.5,
            maxWidth: 350,
            width: '100%',
            height: 'auto',
            borderRadius: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            transition: 'transform 0.3s ease-out',
            cursor: 'grab',
            '&:active': {
              cursor: 'grabbing',
              transform: 'scale(0.98)'
            }
          }}
          {...swipeHandlers}>
          <Stack width="100%" direction="row" alignItems="center" spacing={0.5}>
            <Tooltip title="Switch Payment Wallet">
              <Box
                onClick={() => setOpenSelectFlow(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8
                  }
                }}>
                <GoArrowSwitch size={20} />
                <PaymentFlowSection navigation flow={selectedFlow} />
              </Box>
            </Tooltip>
            <Tooltip title={balanceVisible ? 'Hide Balance' : 'Show Balance'}>
              <IconButton size="small" onClick={handleBalanceVisibilityToggle}>
                {balanceVisible ? (
                  <VisibilityOff sx={{ fontSize: 16 }} />
                ) : (
                  <Visibility sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            </Tooltip>
          </Stack>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            width="100%"
            height={50}>
            {isLoading || !totalBalance ? (
              <Skeleton variant="rectangular" height={50} width={120} />
            ) : (
              <Typography
                fontSize={40}
                fontWeight="bold"
                onMouseDown={handleBalanceMouseDown}
                onMouseUp={handleBalanceMouseUp}
                onMouseLeave={handleBalanceMouseUp}
                onTouchStart={handleBalanceMouseDown}
                onTouchEnd={handleBalanceMouseUp}
                sx={nonSelectableText}>
                {balanceVisible ? `$${isFetched ? totalBalance : 'N/A'}` : '*****'}
              </Typography>
            )}
            <Stack direction="row" spacing={1}>
              <ActionButton
                title="Add"
                tooltip="Add crypto"
                onClick={handleReceive}
                icon={<TbPlus />}
              />
              <ActionButton
                title="Pay"
                tooltip="Pay with crypto"
                disabled={selectedFlow.type === 'BANKR' || selectedFlow.type === 'RODEO'}
                onClick={handleSend}
                icon={<TbSend />}
              />
            </Stack>
          </Box>
        </Card>

        {recipient && (
          <LazyPaymentDialog
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
                  profile
                })
              }
            }}
            recipient={recipient}
            setOpenSearchIdentity={setOpenSearchIdentity}
            flow={
              selectedFlow.type !== 'BANKR' && selectedFlow.type !== 'RODEO'
                ? selectedFlow
                : undefined
            }
            closeStateCallback={async () => {
              setRecipient(undefined);
            }}
          />
        )}

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

        <ChooseFlowDialog
          open={openSelectFlow}
          closeOnSelect={false}
          onClose={() => setOpenSelectFlow(false)}
          closeStateCallback={() => setOpenSelectFlow(false)}
          flows={flows}
          selectedFlow={selectedFlow}
          setSelectedFlow={setSelectedFlow}
        />
        <FlowTopUpMenu
          anchorEl={topUpMenuAnchorEl}
          open={openTopUpMenu}
          depositClickCallback={() => {
            setPaymentType('payflow');
            setRecipient({
              type: 'profile',
              identity: { profile: { ...profile, defaultFlow: selectedFlow } } as IdentityType
            });
          }}
          frameClickCallback={() => setOpenPayMeDialog(true)}
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
          wallets={selectedFlow.wallets}
          closeStateCallback={() => setOpenFlowReceiveQRCode(false)}
        />
        <PayMeDialog
          open={openPayMeDialog}
          onClose={() => setOpenPayMeDialog(false)}
          flow={selectedFlow}
          profile={profile}
        />
      </>
    )
  );
}
