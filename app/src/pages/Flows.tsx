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
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import FlowNewDialog from '../components/FlowNewDialog';
import { useAccount, useNetwork } from 'wagmi';
import axios from 'axios';
import { FlowType } from '../types/FlowType';
import { OpenInFull, ShareOutlined } from '@mui/icons-material';
import FlowShareDialog from '../components/FlowShareDialog';
import FlowViewDialog from '../components/FlowViewDialog';
import { getFlowBalance } from '../utils/getFlowBalance';

export default function Flows() {
  const { isConnected, address } = useAccount();
  const [flows, setFlows] = useState([] as FlowType[]);
  const [balances, setBalances] = useState([] as string[]);

  const [openFlowCreate, setOpenFlowCreate] = useState(false);
  const [openFlowShare, setOpenFlowShare] = useState(false);
  const [openFlowView, setOpenFlowView] = useState(false);
  const [flowShareInfo, setFlowShareInfo] = useState({} as { title: string; link: string });
  const [flow, setFlow] = useState({} as FlowType);

  const { chains } = useNetwork();

  useMemo(async () => {
    if (isConnected) {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/flows?account=${address}`
        );

        setFlows(response.data);

        console.log(response.data);
      } catch (error) {
        console.log(error);
      }
    }
  }, [isConnected]);

  // TODO: separate the logic into each card flow fetching its data separately
  useMemo(async () => {
    if (flows) {
      const flowBalances = flows.map(async (flow) => {
        return getFlowBalance(flow, chains, 1850);
      });
      setBalances(await Promise.all(flowBalances));
    }
  }, [flows]);

  const cardBorderColours = ['lightgreen', 'lightblue', 'lightpink', 'lightyellow'];

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
                  //ackground: red[400]
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
                  <Typography variant="subtitle2">${balances[index]}</Typography>
                  <AvatarGroup
                    max={5}
                    total={flow.wallets.length}
                    sx={{
                      '& .MuiAvatar-root': { width: 20, height: 20, fontSize: 10 }
                    }}>
                    {[...Array(Math.min(4, flow.wallets.length))].map((item, i) => (
                      <Avatar
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
      <FlowNewDialog open={openFlowCreate} closeStateCallback={() => setOpenFlowCreate(false)} />
      <FlowShareDialog
        open={openFlowShare}
        title={flowShareInfo.title}
        link={flowShareInfo.link}
        closeStateCallback={() => setOpenFlowShare(false)}
      />
      <FlowViewDialog
        open={openFlowView}
        flow={flow}
        closeStateCallback={() => setOpenFlowView(false)}
      />
    </>
  );
}
