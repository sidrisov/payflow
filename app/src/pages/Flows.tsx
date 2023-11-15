import {
  Avatar,
  AvatarGroup,
  Box,
  Card,
  Container,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import FlowNewDialog from '../components/FlowNewDialog';
import { useNetwork } from 'wagmi';
import { FlowType, FlowWalletType } from '../types/FlowType';
import { Add, OpenInFull, ShareOutlined } from '@mui/icons-material';
import ShareDialog from '../components/ShareDialog';
import FlowViewDialog from '../components/FlowViewDialog';
import { getTotalBalance, getWalletBalance } from '../utils/getBalance';
import { UserContext } from '../contexts/UserContext';
import { formatEther } from 'viem';
import { DAPP_URL } from '../utils/urlConstants';
import NetworkAvatar from '../components/NetworkAvatar';

// TODO: move to FlowCard

export default function Flows() {
  const theme = useTheme();

  const {
    isAuthenticated,
    flows,
    walletBalances,
    setWalletBalances,
    setInitiateFlowsRefresh,
    ethUsdPrice
  } = useContext(UserContext);

  const { chains } = useNetwork();

  const [flowBalances, setFlowBalances] = useState<Map<string, string>>();
  const [openFlowCreate, setOpenFlowCreate] = useState(false);
  const [openFlowShare, setOpenFlowShare] = useState(false);
  const [openFlowView, setOpenFlowView] = useState(false);
  const [flowShareInfo, setFlowShareInfo] = useState({} as { title: string; link: string });
  const [flow, setFlow] = useState<FlowType>();

  async function fetchWalletBalances() {
    if (flows) {
      // js is weird, no proper Set/Map impl, doing little hack here to find unique wallets
      const uniqueWallets = Array.from(
        flows
          .reduce((wb, flow) => {
            flow.wallets.forEach((wallet) => {
              const key = `${wallet.address}_${wallet.network}`;
              if (!wb.has(key)) {
                wb.set(key, wallet);
              }
            });
            return wb;
          }, new Map<string, FlowWalletType>())
          .values()
      );

      Promise.all(
        uniqueWallets.map(async (wallet) => (await getWalletBalance(wallet, chains)).value)
      ).then((balances) => {
        const balancesMap = new Map<string, bigint>();
        balances.forEach((value, index) => {
          const key = `${uniqueWallets[index].address}_${uniqueWallets[index].network}`;
          balancesMap.set(key, value);
        });
        setWalletBalances(balancesMap);
      });
    }
  }

  async function calculateFlowBalances(ethUsdPrice: number) {
    if (flows) {
      const flowBalances = new Map<string, string>();
      flows.forEach(async (flow) => {
        const balances = flow.wallets
          .map((wallet) => walletBalances.get(`${wallet.address}_${wallet.network}`))
          .filter((balance) => balance) as bigint[];
        const flowBalance = (
          parseFloat(formatEther(await getTotalBalance(balances))) * ethUsdPrice
        ).toFixed(1);
        flowBalances.set(flow.uuid, flowBalance);
      });
      return flowBalances;
    }
  }

  useMemo(async () => {
    if (flows) {
      await fetchWalletBalances();
    }
  }, [flows]);

  useMemo(async () => {
    if (flows && walletBalances && walletBalances.size > 0 && ethUsdPrice) {
      calculateFlowBalances(ethUsdPrice).then((balances) => {
        // explicitly wait for calculation to finish, otherwise re-render doesn't work properly
        setFlowBalances(balances);
      });
    }
  }, [flows, walletBalances, ethUsdPrice]);

  return (
    <>
      <Helmet>
        <title> PayFlow | Flows </title>
      </Helmet>
      <Container>
        {isAuthenticated && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
            <Card
              elevation={10}
              sx={{
                m: 2,
                p: 2,
                width: 250,
                height: 200,
                border: 3,
                borderRadius: 5,
                borderStyle: 'dashed',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between">
                <Typography fontSize={20} fontWeight="bold">
                  Create New Jar
                </Typography>
                <Avatar src="/jar2.png" sx={{ p: 1, width: 48, height: 48 }} />
              </Box>
              <Typography fontSize={12} fontWeight="bold">
                Receive payments for different purposes: savings, income, creator support,
                fundraising, collecting for a friend's birthday - ANYTHING!
              </Typography>
              <IconButton
                color="inherit"
                size="small"
                onClick={() => {
                  setOpenFlowCreate(true);
                }}
                sx={{
                  border: 1,
                  borderStyle: 'dashed',
                  alignSelf: 'flex-end',
                  justifySelf: 'flex-end'
                }}>
                <Add fontSize="small" />
              </IconButton>
            </Card>
            {flows &&
              flows.map((flow) => (
                <Card
                  key={`flow_card_${flow.uuid}`}
                  elevation={10}
                  sx={{
                    m: 2,
                    p: 2,
                    width: 250,
                    height: 200,
                    border: 3,
                    borderRadius: 5,
                    borderStyle: 'double',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                  <Box display="flex" flexDirection="row" justifyContent="space-between">
                    <Stack spacing={1}>
                      <Typography fontSize={20} fontWeight="bold" maxHeight={60} overflow="scroll">
                        {flow.title}
                      </Typography>
                      <Typography fontSize={12} fontWeight="bold" maxHeight={50} overflow="scroll">
                        {flow.description}
                      </Typography>
                    </Stack>
                    <Tooltip title="Expand in fullsreen">
                      <IconButton
                        color="inherit"
                        onClick={() => {
                          setFlow(flow);
                          setOpenFlowView(true);
                        }}
                        sx={{ justifySelf: 'flex-end', alignSelf: 'flex-start' }}>
                        <OpenInFull fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box
                    display="flex"
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center">
                    <Typography variant="subtitle2">
                      ${flowBalances ? flowBalances.get(flow.uuid) : ''}
                    </Typography>
                    <AvatarGroup
                      max={5}
                      total={flow.wallets.length}
                      sx={{
                        '& .MuiAvatar-root': { width: 20, height: 20, fontSize: 10 }
                      }}>
                      {[...Array(Math.min(4, flow.wallets.length))].map((_item, i) => (
                        <NetworkAvatar
                          key={`wallet_avatar_${flow.uuid}_${i}`}
                          tooltip
                          network={flow.wallets[i].network}
                        />
                      ))}
                    </AvatarGroup>
                    <Tooltip title="Share Link / QR">
                      <span>
                        <IconButton
                          disabled={flow.wallets.length === 0}
                          color="inherit"
                          sx={{ alignSelf: 'flex-end' }}
                          onClick={() => {
                            setFlowShareInfo({
                              title: flow.title,
                              link: `${DAPP_URL}/jar/${flow.uuid}`
                            });
                            setOpenFlowShare(true);
                          }}>
                          <ShareOutlined />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Card>
              ))}
          </Box>
        )}
      </Container>
      <FlowNewDialog
        open={openFlowCreate}
        closeStateCallback={async () => {
          setOpenFlowCreate(false);
          // TODO: just refresh, lately it's better to track each flow's update separately
          setInitiateFlowsRefresh(true);
        }}
      />
      <ShareDialog
        open={openFlowShare}
        title={flowShareInfo.title}
        link={flowShareInfo.link}
        closeStateCallback={async () => setOpenFlowShare(false)}
      />
      <FlowViewDialog
        open={openFlowView}
        flow={flow}
        closeStateCallback={async () => {
          setOpenFlowView(false);
          // TODO: just refresh, lately it's better to track each flow's update separately
          setInitiateFlowsRefresh(true);
        }}
      />
    </>
  );
}
