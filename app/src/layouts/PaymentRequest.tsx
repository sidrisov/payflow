import { Hash, parseEther } from 'viem';

import {
  useEnsAvatar,
  useEnsName,
  usePrepareSendTransaction,
  usePublicClient,
  useSendTransaction,
  useSwitchNetwork
} from 'wagmi';
import AddressAvatar from '../components/AddressAvatar';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import { useMemo, useRef, useState } from 'react';
import { Id, toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { shortenWalletAddressLabel } from '../utils/address';
import { ContentCopy, DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';
import { copyToClipboard } from '../utils/copyToClipboard';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import HideOnScroll from '../components/HideOnScroll';
import { Helmet } from 'react-helmet-async';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import { PaymentRequestType } from '../types/PaymentRequestType';
import { API_URL } from '../utils/urlConstants';
import NetworkAvatar from '../components/NetworkAvatar';

export default function PaymentRequest({ appSettings, setAppSettings }: any) {
  const { uuid } = useParams();
  const [request, setRequest] = useState<PaymentRequestType>();

  const { data: ensName } = useEnsName({
    address: request?.account,
    chainId: 1,
    cacheTime: 300_000
  });

  const { data: avatar } = useEnsAvatar({
    name: ensName,
    chainId: 1,
    cacheTime: 300_000
  });

  const publicClient = usePublicClient();
  const { chains, switchNetwork } = useSwitchNetwork();

  const { config } = usePrepareSendTransaction({
    enabled: request !== undefined,
    to: request?.address,
    value: request && parseEther(request?.amount),
    chainId: chains.find((c) => c.name === request?.flowUuid)?.id
  });

  const { isSuccess, isError, data, sendTransaction } = useSendTransaction(config);

  const [txHash, setTxHash] = useState<Hash>();

  const requestToastId = useRef<Id>();

  useMemo(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/requests/${uuid}`);

      setRequest(response.data);
    } catch (error) {
      console.error(error);
    }
  }, [uuid]);

  useMemo(async () => {
    if (request) {
      switchNetwork?.(request.network);
    }
  }, [request]);

  useMemo(async () => {
    if (isSuccess) {
      setTxHash(data?.hash);
    } else if (isError) {
      if (requestToastId.current) {
        toast.update(requestToastId.current, {
          render: `Payment failed! 😕`,
          type: 'error',
          isLoading: false,
          autoClose: 5000
        });
        requestToastId.current = undefined;
      }
    }
  }, [isSuccess, isError, data]);

  async function submitProof() {
    try {
      const response = await axios.post(`${API_URL}/api/requests/${request?.uuid}/proof`, {
        txHash
      });
      console.debug(response.status);
      toast.success(`Payment request proof submitted`);
    } catch (error) {
      console.error(error);
      toast.error('Try again!');
    }
  }

  useMemo(async () => {
    if (txHash) {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash
      });

      console.debug('Receipt: ', receipt);

      if (receipt && receipt.status === 'success') {
        if (requestToastId.current) {
          toast.update(requestToastId.current, {
            render: `Payment confirmed!`,
            type: 'success',
            isLoading: false,
            autoClose: 5000
          });
          requestToastId.current = undefined;
        }
        await submitProof();
      } else {
        if (requestToastId.current) {
          toast.update(requestToastId.current, {
            render: `Payment failed! 😕`,
            type: 'error',
            isLoading: false,
            autoClose: 5000
          });
          requestToastId.current = undefined;
        }
      }
    }
  }, [txHash]);

  return (
    <CustomThemeProvider darkMode={appSettings.darkMode}>
      <Helmet>
        <title> Payflow | Request </title>
      </Helmet>
      <HideOnScroll>
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{ alignItems: 'flex-end', backdropFilter: 'blur(5px)' }}>
          <Toolbar
            sx={{
              justifyContent: 'space-between'
            }}>
            <Stack direction="row" spacing={1}>
              <IconButton
                onClick={() => setAppSettings({ ...appSettings, darkMode: !appSettings.darkMode })}>
                {appSettings.darkMode ? <DarkModeOutlined /> : <LightModeOutlined />}
              </IconButton>

              <ConnectButton
                showBalance={{ smallScreen: false, largeScreen: true }}
                chainStatus={{ smallScreen: 'icon', largeScreen: 'full' }}
              />
            </Stack>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Box
        position="fixed"
        display="flex"
        alignItems="center"
        boxSizing="border-box"
        justifyContent="center"
        sx={{ inset: 0 }}>
        <Card
          elevation={10}
          sx={{
            p: 5,
            width: 400,
            height: 350,
            border: 3,
            borderRadius: 5,
            borderStyle: 'double',
            borderColor: 'divider'
          }}>
          {request && (
            <Box display="flex" flexDirection="column" alignItems="center">
              <Divider flexItem sx={{ my: 1 }}>
                <Card
                  elevation={10}
                  sx={{
                    p: 1,
                    border: 2,
                    borderColor: 'divider',
                    borderStyle: 'double',
                    borderRadius: 5,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                  {avatar ? (
                    <Avatar src={avatar as string} sx={{ width: 40, height: 40 }} />
                  ) : (
                    <AddressAvatar address={request.account} />
                  )}
                  <Typography ml={1} variant="subtitle2">
                    {ensName ? ensName : shortenWalletAddressLabel(request.account)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      copyToClipboard(request.account);
                      toast.success('Address is copied!');
                    }}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Card>
              </Divider>

              <Typography variant="h6" maxHeight={50} overflow="auto">
                {request.title}
              </Typography>
              <Typography variant="subtitle2" maxHeight={50} overflow="auto">
                {request.description}
              </Typography>

              <Box mt={1} display="flex" flexDirection="row" alignItems="center">
                <NetworkAvatar network={request.network} sx={{ width: 24, height: 24 }} />
                <Typography ml={1}>{request.network}</Typography>
                <Typography ml={1}>{shortenWalletAddressLabel(request.address)}</Typography>
                <Tooltip title="Copy Address">
                  <IconButton
                    size="small"
                    onClick={() => {
                      copyToClipboard(request.address);
                      toast.success('Address is copied!');
                    }}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography>Amount: {request.amount} ETH</Typography>

              <Divider flexItem sx={{ my: 2 }}>
                <Button
                  disabled={!sendTransaction}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  color="primary"
                  onClick={() => {
                    requestToastId.current = toast.loading(
                      `Sending ${request.amount} to ${shortenWalletAddressLabel(request.address)}`
                    );
                    sendTransaction?.();
                  }}
                  sx={{ mt: 1, borderRadius: 3 }}>
                  PAY REQUEST
                </Button>
              </Divider>
            </Box>
          )}
        </Card>
      </Box>
    </CustomThemeProvider>
  );
}
