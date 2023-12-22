import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ProfileContext } from '../contexts/UserContext';
import {
  Avatar,
  Box,
  Card,
  Collapse,
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
import {
  Add,
  Check,
  KeyboardArrowDown,
  KeyboardArrowUp,
  OpenInNew,
  ShareOutlined
} from '@mui/icons-material';
import { shortenWalletAddressLabel } from '../utils/address';
import RequestNewDialog from '../components/RequestNewDialog';
import ShareDialog from '../components/ShareDialog';
import { useNetwork, usePublicClient } from 'wagmi';
import { toast } from 'react-toastify';
import { switchNetwork } from 'wagmi/actions';
import { formatEther } from 'viem';
import { green } from '@mui/material/colors';
import { API_URL, DAPP_URL } from '../utils/urlConstants';
import NetworkAvatar from '../components/NetworkAvatar';

export default function Requests() {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const publicClient = usePublicClient();
  const { chains, chain } = useNetwork();

  const { isAuthenticated } = useContext(ProfileContext);
  const {
    profile: { flows }
  } = useContext(ProfileContext);
  const [requests, setRequests] = useState<PaymentRequestType[]>();

  const [openRequestCreate, setOpenRequestCreate] = useState(false);
  const [openRequestShare, setOpenRequestShare] = useState(false);
  const [requestShareInfo, setRequestShareInfo] = useState<{ title: string; link: string }>();

  const [requestInVerification, setRequestInVerification] = useState<PaymentRequestType>();

  async function fetchRequests() {
    try {
      const response = await axios.get(`${API_URL}/api/requests`, { withCredentials: true });

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
            `${API_URL}/api/requests/${request.uuid}/payed`,
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

  function RequestTableRow(props: { index: number; request: PaymentRequestType }) {
    const { index, request } = props;
    const [expand, setExpand] = useState(false);
    const requestChain = chains.find((c) => c.id === request.network);

    return (
      <>
        <TableRow>
          {!smallScreen && <TableCell align="center">{index + 1}</TableCell>}
          <TableCell align="center">{request.title}</TableCell>
          {!smallScreen && (
            <TableCell align="center">
              {flows?.find((f) => f.uuid === request.flowUuid)?.title}
            </TableCell>
          )}
          <TableCell>
            <Box display="flex" flexDirection="row" justifyContent="flex-start" alignItems="center">
              <NetworkAvatar
                tooltip
                network={request.network}
                sx={{ ml: 2, width: 24, height: 24 }}
              />
              {!smallScreen && (
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {`${request.network} : `}
                </Typography>
              )}
              <Typography variant="body2" sx={{ ml: 1 }}>
                {shortenWalletAddressLabel(request.address)}
              </Typography>
            </Box>
          </TableCell>
          <TableCell align="center">{request.amount}</TableCell>
          <TableCell align="center">
            {request.payed ? '✅ Payed' : request.proof ? '📝 Verify' : '⏳ Pending'}
          </TableCell>
          <TableCell>
            <Stack spacing="5" direction="row">
              {request.payed && (
                <IconButton
                  aria-label="expand row"
                  size="small"
                  onClick={() => setExpand(!expand)}
                  sx={{ border: 0.5, borderStyle: 'dashed' }}>
                  {expand ? (
                    <Tooltip title="Collapse">
                      <KeyboardArrowUp fontSize="small" />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Show Details">
                      <KeyboardArrowDown fontSize="small" />
                    </Tooltip>
                  )}
                </IconButton>
              )}
              {!request.payed && !request.proof && (
                <Tooltip title="Share Link / QR">
                  <IconButton
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setRequestShareInfo({
                        title: request.title,
                        link: `${DAPP_URL}/request/${request.uuid}`
                      });
                      setOpenRequestShare(true);
                    }}
                    sx={{ border: 0.5, borderStyle: 'dashed' }}>
                    <ShareOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {!request.payed && request.proof && (
                <Tooltip title="Verify Proof">
                  <IconButton
                    color="inherit"
                    size="small"
                    onClick={async () => {
                      if (requestChain) {
                        if (requestChain.id !== chain?.id) {
                          await switchNetwork({ chainId: requestChain.id });
                        }
                        setRequestInVerification(request);
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
        <TableRow>
          <TableCell sx={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
            <Collapse in={expand} timeout="auto" unmountOnExit>
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                m="5"
                sx={{ margin: 3 }}>
                <Typography variant="body2">
                  Transaction Hash: {shortenWalletAddressLabel(request.proof)}
                </Typography>
                <Tooltip title={`View on ${requestChain?.blockExplorers?.default.url}`}>
                  <a
                    href={`${requestChain?.blockExplorers?.default.url}/tx/${request.proof}`}
                    target="_blank">
                    <OpenInNew sx={{ justifySelf: 'center', color: green[500] }} fontSize="small" />
                  </a>
                </Tooltip>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title> Payflow | Requests </title>
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
            <TableContainer sx={{ minHeight: 100, maxHeight: 500 }}>
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
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests &&
                    requests.map((request, i) => (
                      <RequestTableRow index={i} key={request.uuid} request={request} />
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
