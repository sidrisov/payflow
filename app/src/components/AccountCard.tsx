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
import { Receipt, ArrowDownward, Send, AccountBalance, Toll } from '@mui/icons-material';
import { useContext, useMemo, useState } from 'react';
import AccountSendDialog from './AccountSendDialog';
import { ProfileContext } from '../contexts/UserContext';
import { BalanceFetchResultType } from '../types/BalanceFetchResultType';
import { formatEther } from 'viem';
import { WalletsInfoPopover } from './WalletsInfoPopover';
import { FlowType } from '../types/FlowType';
import { ChooseFlowMenu } from './ChooseFlowMenu';
import { FlowTopUpMenu } from './FlowTopUpMenu';
import WalletQRCodeShareDialog from './WalletQRCodeShareDialog';
import NetworkAvatar from './NetworkAvatar';
import { useNetwork } from 'wagmi';

export type AccountNewDialogProps = CardProps & {
  flows: FlowType[];
  selectedFlow: FlowType;
  setSelectedFlow: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  balanceFetchResult: BalanceFetchResultType;
  assetsOrActivityView: 'assets' | 'activity';
  setAssetsOrActivityView: React.Dispatch<React.SetStateAction<'assets' | 'activity'>>;
};

export function AccountCard(props: AccountNewDialogProps) {
  const { ethUsdPrice, profile } = useContext(ProfileContext);
  const { flows, selectedFlow, setSelectedFlow } = props;

  const [openWithdrawalDialog, setOpenWithdrawalDialog] = useState(false);
  const [openWalletDetailsPopover, setOpenWalletDetailsPopover] = useState(false);
  const [openSelectFlow, setOpenSelectFlow] = useState(false);
  const [openTopUpMenu, setOpenTopUpMenu] = useState(false);
  const [openFlowReceiveQRCode, setOpenFlowReceiveQRCode] = useState(false);

  const [walletAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);
  const [flowAnchorEl, setFlowAnchorEl] = useState<null | HTMLElement>(null);
  const [topUpMenuAnchorEl, setTopUpMenuAnchorEl] = useState<null | HTMLElement>(null);

  const { loading, fetched, balances } = props.balanceFetchResult;
  const [totalBalance, setTotalBalance] = useState<string>();

  const { chain } = useNetwork();

  useMemo(async () => {
    if (fetched && balances.length > 0 && ethUsdPrice) {
      const totalBalance = formatEther(
        balances
          // don't count ERC20 for now
          .filter((balance) => !balance.asset.token && balance.balance)
          .reduce((previousValue, currentValue) => {
            return previousValue + (currentValue.balance?.value ?? BigInt(0));
          }, BigInt(0))
      );

      setTotalBalance((parseFloat(totalBalance) * ethUsdPrice).toFixed(1));
    }
  }, [fetched, balances.length, ethUsdPrice]);

  return (
    <Card
      elevation={10}
      sx={{
        m: 2,
        p: 2,
        width: 350,
        height: 200,
        border: 3,
        borderRadius: 5,
        borderStyle: 'double',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
      <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="center">
        <Tooltip title="Flow wallets">
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
                network={selectedFlow.wallets[i].network}
              />
            ))}
          </AvatarGroup>
        </Tooltip>

        <Stack
          spacing={1}
          direction="row"
          alignItems="center"
          sx={{ p: 0, border: 1, borderStyle: 'dashed', borderRadius: 5 }}>
          <Tooltip title="Select flow">
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
          {loading || !totalBalance ? (
            <Skeleton variant="rectangular" height={40} width={80} sx={{ borderRadius: 3 }} />
          ) : (
            <Typography variant="h4">${fetched ? totalBalance : 'N/A'}</Typography>
          )}
        </Box>
      </Divider>
      <Stack spacing={2} direction="row" alignSelf="center">
        <Tooltip title="Receive">
          <IconButton
            color="inherit"
            onClick={(event) => {
              setTopUpMenuAnchorEl(event.currentTarget);
              setOpenTopUpMenu(true);
            }}
            sx={{ border: 1, borderStyle: 'dashed' }}>
            <ArrowDownward />
          </IconButton>
        </Tooltip>
        <Tooltip title="Send">
          <IconButton
            color="inherit"
            onClick={async () => {
              setOpenWithdrawalDialog(true);
            }}
            sx={{ border: 1, borderStyle: 'dashed' }}>
            <Send />
          </IconButton>
        </Tooltip>
        <Tooltip title={props.assetsOrActivityView === 'assets' ? ' Activity' : 'Assets'}>
          <IconButton
            color="inherit"
            onClick={() => {
              props.setAssetsOrActivityView(
                props.assetsOrActivityView === 'assets' ? 'activity' : 'assets'
              );
            }}
            sx={{ border: 1, borderStyle: 'dashed' }}>
            {props.assetsOrActivityView === 'assets' ? <Receipt /> : <AccountBalance />}
          </IconButton>
        </Tooltip>
      </Stack>
      {openWithdrawalDialog && (
        <AccountSendDialog
          open={openWithdrawalDialog}
          flow={selectedFlow}
          closeStateCallback={async () => setOpenWithdrawalDialog(false)}
        />
      )}
      <WalletsInfoPopover
        open={openWalletDetailsPopover}
        onClose={async () => setOpenWalletDetailsPopover(false)}
        anchorEl={walletAnchorEl}
        flow={selectedFlow}
        balanceFetchResult={{ loading, fetched, balances }}
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
        profile={profile}
        anchorEl={topUpMenuAnchorEl}
        open={openTopUpMenu}
        qrClickCallback={() => setOpenFlowReceiveQRCode(true)}
        onClose={() => setOpenTopUpMenu(false)}
        onClick={() => setOpenTopUpMenu(false)}
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
  );
}
