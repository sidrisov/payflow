import { useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserContext } from '../contexts/UserContext';
import {
  Box,
  Card,
  Container,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import axios from 'axios';
import { PaymentRequestType } from '../types/PaymentRequestType';
import { Add } from '@mui/icons-material';
import { shortenWalletAddressLabel } from '../utils/address';
import RequestNewDialog from '../components/RequestNewDialog';

export default function Requests() {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { isAuthenticated } = useContext(UserContext);
  const [requests, setRequests] = useState<PaymentRequestType[]>();

  const [openRequestCreate, setOpenRequestCreate] = useState(false);

  async function fetchRequests() {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/requests`,
        { withCredentials: true }
      );

      console.log({ response });
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
              p: 2,
              border: 3,
              borderRadius: 5,
              borderStyle: 'double',
              borderColor: 'divider'
            }}>
            <Toolbar>
              <Box display="flex" flexDirection="row" alignItems="center">
                <Typography fontSize={20} fontWeight="bold">
                  New Payment Request
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
                    <TableCell align="center">ID</TableCell>
                    <TableCell align="center">Title</TableCell>
                    <TableCell align="center">Flow</TableCell>
                    <TableCell align="center">Wallet</TableCell>
                    <TableCell align="center">Amount (ETH)</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests &&
                    requests.map((_, i) => (
                      <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell align="center">{i + 1}</TableCell>
                        <TableCell align="center">{requests[i].title}</TableCell>
                        <TableCell align="center">{requests[i].flowUuid}</TableCell>
                        <TableCell align="center">
                          {`${requests[i].network} : ${shortenWalletAddressLabel(
                            requests[i].address
                          )}`}
                        </TableCell>
                        <TableCell align="center">{requests[i].amount}</TableCell>
                        <TableCell align="center">
                          {requests[i].payed ? '✅ Payed' : '⏳ Pending'}
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
    </>
  );
}
