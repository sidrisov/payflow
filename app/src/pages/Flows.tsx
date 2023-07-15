import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  Container,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import FlowNewDialog from '../components/FlowNewDialog';
import { useAccount, useNetwork } from 'wagmi';
import axios from 'axios';
import { FlowType, FlowWalletType } from '../types/FlowType';
import { OpenInFull, ShareOutlined } from '@mui/icons-material';
import FlowShareDialog from '../components/FlowShareDialog';
import FlowViewDialog from '../components/FlowViewDialog';
import { getTotalBalance, getWalletBalance } from '../utils/getBalance';
import { UserContext } from '../contexts/UserContext';
import { formatEther } from 'viem';

const cardBorderColours = ['lightgreen', 'lightblue', 'lightpink', 'lightyellow'];

export default function Flows() {
  const { isConnected, address } = useAccount();
  const { walletBalances, setWalletBalances } = useContext(UserContext);
  const { chains } = useNetwork();

  const [flows, setFlows] = useState([] as FlowType[]);
  const [flowBalances, setFlowBalances] = useState<Map<string, string>>();
  const [openFlowCreate, setOpenFlowCreate] = useState(false);
  const [openFlowShare, setOpenFlowShare] = useState(false);
  const [openFlowView, setOpenFlowView] = useState(false);
  const [flowShareInfo, setFlowShareInfo] = useState({} as { title: string; link: string });
  const [flow, setFlow] = useState({} as FlowType);

  async function fetchFlows() {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/flows?account=${address}`
      );

      setFlows(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchWalletBalances() {
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
      console.log('Succes', balances);
      const balancesMap = new Map<string, bigint>();
      balances.forEach((value, index) => {
        const key = `${uniqueWallets[index].address}_${uniqueWallets[index].network}`;
        balancesMap.set(key, value);
      });
      setWalletBalances(balancesMap);
    });
  }

  async function calculateFlowBalances() {
    const flowBalances = new Map<string, string>();
    flows.forEach(async (flow) => {
      const balances = flow.wallets
        .map((wallet) => {
          const balance = walletBalances.get(`${wallet.address}_${wallet.network}`);
          console.log(balance);
          return balance;
        })
        .filter((balance) => balance) as bigint[];
      const flowBalance = (parseFloat(formatEther(await getTotalBalance(balances))) * 1850).toFixed(
        1
      );
      flowBalances.set(flow.uuid, flowBalance);
    });

    setFlowBalances(flowBalances);
  }

  useMemo(async () => {
    if (isConnected) {
      fetchFlows();
    }
  }, [isConnected]);

  useMemo(async () => {
    if (flows) {
      await fetchWalletBalances();
    }
  }, [flows]);

  useMemo(async () => {
    if (walletBalances && walletBalances.size > 0) {
      await calculateFlowBalances();
    }
  }, [walletBalances]);

  return (
    <>
      <Helmet>
        <title> PayFlow | Flows </title>
      </Helmet>
      <Container>
        {isConnected && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'flex-start'
            }}>
            <Card
              elevation={10}
              sx={{
                m: 2,
                p: 2,
                width: 250,
                height: 200,
                border: 3,
                borderRadius: 3,
                borderStyle: 'dashed',
                borderColor: 'divider'
              }}>
              <Stack direction="column" spacing={1}>
                <Typography fontSize={20} fontWeight="bold">
                  New flow
                </Typography>
                <Typography fontSize={12} fontWeight="bold">
                  Receive payments for different purposes: savings, income, creator support,
                  fundraising, collecting for a friend's birthday - ANYTHING!
                </Typography>
                <Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="medium"
                    sx={{
                      mt: 1,
                      borderRadius: 3
                    }}
                    onClick={() => {
                      setOpenFlowCreate(true);
                    }}>
                    Create
                  </Button>
                </Box>
              </Stack>
            </Card>
            {flows.map((flow, index) => (
              <Card
                key={`flow_card_${flow.uuid}`}
                elevation={10}
                sx={{
                  m: 2,
                  p: 2,
                  width: 250,
                  height: 200,
                  borderRadius: 5,
                  border: 2,
                  borderColor: cardBorderColours[(cardBorderColours.length * Math.random()) | 0],
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                <Box display="flex" flexDirection="row" justifyContent="space-between">
                  <Stack spacing={1}>
                    <Typography fontSize={20} fontWeight="bold" maxHeight={50} overflow="scroll">
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
                    {[...Array(Math.min(4, flow.wallets.length))].map((item, i) => (
                      <Avatar
                        key={`wallet_avatar_${flow.uuid}_${i}`}
                        src={'/public/networks/' + flow.wallets[i].network.toLowerCase() + '.png'}
                      />
                    ))}
                  </AvatarGroup>
                  <Tooltip title="Share link or QR">
                    <IconButton
                      color="inherit"
                      sx={{ alignSelf: 'flex-end' }}
                      onClick={() => {
                        setFlowShareInfo({
                          title: flow.title,
                          link: `http://app.payflow.me:5173/send/${flow.uuid}`
                        });
                        setOpenFlowShare(true);
                      }}>
                      <ShareOutlined />
                    </IconButton>
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
          //fetchFlows();
        }}
      />
      <FlowShareDialog
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
          //fetchFlows();
        }}
      />
    </>
  );
}
