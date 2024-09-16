import {
  Box,
  Card,
  CardProps,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import { Share, CallReceived } from '@mui/icons-material';
import { useContext, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { IoMdArrowDropdown } from 'react-icons/io';
import { TbSend } from 'react-icons/tb';
import { useSwipeable } from 'react-swipeable';
import { green } from '@mui/material/colors';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

import { ProfileContext } from '../../contexts/UserContext';
import { BalanceFetchResultType } from '../../types/BalanceFetchResultType';
import { FlowType } from '../../types/FlowType';
import { IdentityType, SelectedIdentityType } from '../../types/ProfileType';
import { ChooseFlowDialog } from '../dialogs/ChooseFlowDialog';
import { FlowTopUpMenu } from '../menu/FlowTopUpMenu';
import WalletQRCodeShareDialog from '../dialogs/WalletQRCodeShareDialog';
import SearchIdentityDialog from '../dialogs/SearchIdentityDialog';
import PaymentDialog, { PaymentSenderType } from '../dialogs/PaymentDialog';
import { ShareFlowMenu } from '../menu/ShareFlowMenu';
import { PaymentFlowSection } from '../PaymentFlowSection';
import { formatAmountWithSuffix } from '../../utils/formats';

export type AccountCardProps = CardProps & {
  flows: FlowType[];
  selectedFlow: FlowType;
  setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  assetBalancesResult: BalanceFetchResultType;
};

const ActionButton = ({
  title,
  onClick,
  icon
}: {
  title: string;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  icon: React.ReactNode;
}) => (
  <Tooltip title={title}>
    <IconButton color="inherit" onClick={onClick} sx={{ border: 1 }}>
      {icon}
    </IconButton>
  </Tooltip>
);

export function AccountCard({
  flows,
  selectedFlow,
  setSelectedFlow,
  assetBalancesResult: { isLoading, isFetched, balances }
}: AccountCardProps) {
  const { profile } = useContext(ProfileContext);

  const [openSearchIdentity, setOpenSearchIdentity] = useState<boolean>(false);
  const [openSelectFlow, setOpenSelectFlow] = useState(false);
  const [openTopUpMenu, setOpenTopUpMenu] = useState(false);
  const [openShareMenu, setOpenShareMenu] = useState(false);

  const [openFlowReceiveQRCode, setOpenFlowReceiveQRCode] = useState(false);

  const [topUpMenuAnchorEl, setTopUpMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [shareMenuAnchorEl, setShareMenuAnchorEl] = useState<null | HTMLElement>(null);

  const [totalBalance, setTotalBalance] = useState<string>();

  const [paymentType, setPaymentType] = useState<PaymentSenderType>();
  const [recipient, setRecipient] = useState<SelectedIdentityType>();

  const { chain, address } = useAccount();

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

  const [isHoveringArrow, setIsHoveringArrow] = useState(false);

  return (
    profile && (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Card
          elevation={5}
          sx={{
            mx: 2,
            p: 2,
            pt: 1,
            px: 2.5,
            pb: 2.5,
            width: 350,
            height: 'auto',
            borderRadius: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            transition: 'transform 0.3s ease-out',
            cursor: 'grab',
            '&:active': {
              cursor: 'grabbing',
              transform: 'scale(0.98)'
            }
          }}
          {...swipeHandlers}>
          <Box
            width="100%"
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center">
            <PaymentFlowSection navigation flow={selectedFlow} />
            <Tooltip title="Payment Flows">
              <IconButton onClick={() => setOpenSelectFlow(true)}>
                <IoMdArrowDropdown />
              </IconButton>
            </Tooltip>
          </Box>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            width="100%"
            height={50}>
            {isLoading || !totalBalance ? (
              <Skeleton variant="rectangular" height={50} width={120} sx={{ borderRadius: 3 }} />
            ) : (
              <Typography fontSize={40} fontWeight="bold">
                ${isFetched ? totalBalance : 'N/A'}
              </Typography>
            )}
            <Stack direction="row" spacing={1}>
              <ActionButton title="Receive funds" onClick={handleReceive} icon={<CallReceived />} />
              <ActionButton title="Send" onClick={handleSend} icon={<TbSend />} />
              <ActionButton title="Share" onClick={handleShare} icon={<Share />} />
            </Stack>
          </Box>
        </Card>
        <Paper
          elevation={5}
          {...(!isHoveringArrow && { onClick: () => setOpenSelectFlow(true) })}
          sx={{
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 16,
            padding: '2px',
            cursor: isHoveringArrow ? 'default' : 'pointer',
            '&:hover': {
              backgroundColor: isHoveringArrow ? 'inherit' : 'action.hover'
            }
          }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleSwipe('RIGHT');
            }}
            onMouseEnter={() => setIsHoveringArrow(true)}
            onMouseLeave={() => setIsHoveringArrow(false)}
            sx={{ p: 0.5 }}>
            <ChevronLeft sx={{ fontSize: 16 }} />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
            {orderedFlows.map((flow, index) => (
              <Box
                key={flow.uuid}
                sx={{
                  width: index === currentIndex ? 6 : 4,
                  height: index === currentIndex ? 6 : 4,
                  borderRadius: '50%',
                  mx: 0.25,
                  bgcolor: index === currentIndex ? green.A700 : 'text.disabled',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleSwipe('LEFT');
            }}
            onMouseEnter={() => setIsHoveringArrow(true)}
            onMouseLeave={() => setIsHoveringArrow(false)}
            sx={{ p: 0.5 }}>
            <ChevronRight sx={{ fontSize: 16 }} />
          </IconButton>
        </Paper>

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
      </Box>
    )
  );
}
