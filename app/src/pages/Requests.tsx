import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserContext } from '../contexts/UserContext';
import {
  Avatar,
  Box,
  Card,
  Container,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import axios from 'axios';
import { PaymentRequestType } from '../types/PaymentRequestType';
import { Add, Check, ShareOutlined } from '@mui/icons-material';
import { shortenWalletAddressLabel } from '../utils/address';
import RequestNewDialog from '../components/RequestNewDialog';
import ShareDialog from '../components/ShareDialog';
import { useNetwork, usePublicClient } from 'wagmi';
import { toast } from 'react-toastify';
import { switchNetwork } from 'wagmi/actions';
import { formatEther } from 'viem';

const DAPP_URL = import.meta.env.VITE_PAYFLOW_SERVICE_DAPP_URL;
export default function Requests() {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const publicClient = usePublicClient();
  const { chains, chain } = useNetwork();

  const { isAuthenticated } = useContext(UserContext);
  const { flows } = useContext(UserContext);
  const [requests, setRequests] = useState<PaymentRequestType[]>();

  const [openRequestCreate, setOpenRequestCreate] = useState(false);
  const [openRequestShare, setOpenRequestShare] = useState(false);
  const [requestShareInfo, setRequestShareInfo] = useState<{ title: string; link: string }>();

  const [requestInVerification, setRequestInVerification] = useState<PaymentRequestType>();

  async function fetchRequests() {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/requests`,
        { withCredentials: true }
      );

      setRequests(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  useMemo(async () => {
    if (isAuthenticated) {
      fetchRequests();
    }
  }, [isAuthenticated]);

  useMemo(async () => {
    if (requestInVerification) {
      await verifyProof(requestInVerification);
      setRequestInVerification(undefined);
    }
  }, [requestInVerification]);

  async function verifyProof(request: PaymentRequestType) {
    if (request.proof) {
      const toastId = toast.loading(`Verifying payment tx hash `);
      try {
        const transaction = await publicClient.getTransaction({
          hash: request.proof
        });

        console.log(transaction);
        if (transaction && formatEther(transaction.value) === request.amount) {
          console.log('I am here');
          const response = await axios.post(
            `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/requests/${request.uuid}/payed`,
            {},
            { withCredentials: true }
          );
          if (response.status === 200) {
            toast.update(toastId, {
              render: `Request was paid!`,
              type: 'success',
              isLoading: false,
              autoClose: 5000
            });
            await fetchRequests();
            return;
          }
        }
      } catch (error) {
        console.error(error);
      }

      toast.update(toastId, {
        render: `Verification failed!`,
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
    }
  }

  return (
    <>
      <Helmet>
        <title> PayFlow | Requests </title>
      </Helmet>
      <Container>
        {isAuthenticated && (
          <Card
            elevation={5}
            sx={{
              m: 2,
              p: 1,
              border: 3,
              borderRadius: 5,
              borderStyle: 'double',
              borderColor: 'divider'
            }}>
            <Toolbar>
              <Box display="flex" flexDirection="row" alignItems="center">
                <Typography fontSize={20} fontWeight="bold">
                  New payment request
                </Typography>
                <IconButton
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setOpenRequestCreate(true);
                  }}
                  sx={{
                    ml: 2,
                    border: 1,
                    borderStyle: 'dashed',
                    alignSelf: 'flex-end',
                    justifySelf: 'flex-end'
                  }}>
                  <Add fontSize="small" />
                </IconButton>
              </Box>
            </Toolbar>
            <TableContainer sx={{ minHeight: 100 }}>
              <Table stickyHeader padding={smallScreen ? 'checkbox' : 'normal'}>
                <TableHead>
                  <TableRow>
                    {!smallScreen && <TableCell align="center">ID</TableCell>}
                    <TableCell align="center">Title</TableCell>
                    {!smallScreen && <TableCell align="center">Flow</TableCell>}
                    <TableCell align="center">Wallet</TableCell>
                    <TableCell align="center">Amount (ETH)</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests &&
                    requests.map((_, i) => (
                      <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        {!smallScreen && <TableCell align="center">{i + 1}</TableCell>}
                        <TableCell align="center">{requests[i].title}</TableCell>
                        {!smallScreen && (
                          <TableCell align="center">
                            {flows?.find((f) => f.uuid === requests[i].flowUuid)?.title}
                          </TableCell>
                        )}
                        <TableCell>
                          <Box
                            display="flex"
                            flexDirection="row"
                            justifyContent="center"
                            alignItems="center">
                            <Avatar
                              src={'/networks/' + requests[i].network + '.png'}
                              sx={{ width: 24, height: 24 }}
                            />
                            {!smallScreen && (
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {`${requests[i].network} : `}
                              </Typography>
                            )}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {shortenWalletAddressLabel(requests[i].address)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{requests[i].amount}</TableCell>
                        <TableCell align="center">
                          {requests[i].payed
                            ? '✅ Payed'
                            : requests[i].proof
                            ? '📝 Verify'
                            : '⏳ Pending'}
                        </TableCell>
                        <TableCell>
                          <Stack spacing="5" direction="row">
                            {!requests[i].payed && !requests[i].proof && (
                              <Tooltip title="Share link or QR">
                                <IconButton
                                  color="inherit"
                                  size="small"
                                  onClick={() => {
                                    setRequestShareInfo({
                                      title: requests[i].title,
                                      link: `${DAPP_URL}/request/${requests[i].uuid}`
                                    });
                                    setOpenRequestShare(true);
                                  }}
                                  sx={{ border: 0.5, borderStyle: 'dashed' }}>
                                  <ShareOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {!requests[i].payed && requests[i].proof && (
                              <Tooltip title="Verify Proof">
                                <IconButton
                                  color="inherit"
                                  size="small"
                                  onClick={async () => {
                                    const requestChainId = chains.find(
                                      (c) => c?.name === requests[i].network
                                    )?.id;

                                    if (requestChainId) {
                                      if (requestChainId !== chain?.id) {
                                        await switchNetwork({ chainId: requestChainId });
                                      }
                                      setRequestInVerification(requests[i]);
                                    }
                                  }}
                                  sx={{ border: 0.5, borderStyle: 'dashed' }}>
                                  <Check fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Container>
      <RequestNewDialog
        open={openRequestCreate}
        closeStateCallback={async () => {
          setOpenRequestCreate(false);
          // TODO: just refresh, lately it's better to track each flow's update separately
          fetchRequests();
        }}
      />
      {requestShareInfo && (
        <ShareDialog
          open={openRequestShare}
          title={requestShareInfo.title}
          link={requestShareInfo.link}
          closeStateCallback={async () => {
            setOpenRequestShare(false);
            setRequestShareInfo(undefined);
          }}
        />
      )}
    </>
  );
}
