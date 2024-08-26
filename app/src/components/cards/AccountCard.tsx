import {
  Box,
  Card,
  CardProps,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';

import { Share, CallReceived } from '@mui/icons-material';
import { useContext, useMemo, useState } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { BalanceFetchResultType } from '../../types/BalanceFetchResultType';
import { FlowType } from '../../types/FlowType';
import { ChooseFlowDialog } from '../dialogs/ChooseFlowDialog';
import { FlowTopUpMenu } from '../menu/FlowTopUpMenu';
import WalletQRCodeShareDialog from '../dialogs/WalletQRCodeShareDialog';
import { useAccount } from 'wagmi';
import SearchIdentityDialog from '../dialogs/SearchIdentityDialog';
import { IdentityType, SelectedIdentityType } from '../../types/ProfileType';
import PaymentDialog, { PaymentSenderType } from '../dialogs/PaymentDialog';
import { Address } from 'viem';
import { ShareFlowMenu } from '../menu/ShareFlowMenu';
import { PaymentFlowSection } from '../PaymentFlowSection';
import { IoMdArrowDropdown } from 'react-icons/io';
import { TbSend } from 'react-icons/tb';

export type AccountNewDialogProps = CardProps & {
  flows: FlowType[];
  selectedFlow: FlowType;
  setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  assetBalancesResult: BalanceFetchResultType;
};

export function AccountCard({
  flows,
  selectedFlow,
  setSelectedFlow,
  assetBalancesResult: { isLoading, isFetched, balances }
}: AccountNewDialogProps) {
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

  return (
    profile && (
      <Card
        elevation={5}
        sx={{
          mx: 2,
          p: 1.5,
          width: 350,
          height: 200,
          borderRadius: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
        <Box
          width="100%"
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center">
          <PaymentFlowSection ml={1} navigation flow={selectedFlow} />
          <Tooltip title="Payment Flows">
            <IconButton onClick={() => setOpenSelectFlow(true)}>
              <IoMdArrowDropdown />
            </IconButton>
          </Tooltip>
        </Box>

        {isLoading || !totalBalance ? (
          <Skeleton variant="rectangular" height={50} width={120} sx={{ borderRadius: 3 }} />
        ) : (
          <Typography fontSize={40} fontWeight="bold">
            ${isFetched ? totalBalance : 'N/A'}
          </Typography>
        )}
        <Stack mb={0.5} spacing={1} direction="row" alignItems="center">
          <Tooltip title="Receive funds">
            <IconButton
              color="inherit"
              onClick={(event) => {
                setTopUpMenuAnchorEl(event.currentTarget);
                setOpenTopUpMenu(true);
              }}
              sx={{ border: 1 }}>
              <CallReceived />
            </IconButton>
          </Tooltip>
          <Tooltip title="Send">
            <IconButton
              color="inherit"
              onClick={async () => {
                setOpenSearchIdentity(true);
              }}
              sx={{ border: 1 }}>
              <TbSend />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share">
            <IconButton
              color="inherit"
              onClick={(event) => {
                setShareMenuAnchorEl(event.currentTarget);
                setOpenShareMenu(true);
              }}
              sx={{ border: 1 }}>
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
      </Card>
    )
  );
}
