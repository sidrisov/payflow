import { Hash, formatEther, formatUnits, parseEther } from 'viem';

import {
  useContractRead,
  useEnsAddress,
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
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import { useMemo, useRef, useState } from 'react';
import { Id, toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { FlowType } from '../types/FlowType';
import axios from 'axios';
import { shortenWalletAddressLabel } from '../utils/address';
import { ContentCopy, DarkModeOutlined, LightModeOutlined, QrCode2 } from '@mui/icons-material';
import { copyToClipboard } from '../utils/copyToClipboard';
import AddressQRCodeDialog from '../components/AddressQRCodeDialog';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import HideOnScroll from '../components/HideOnScroll';
import { getFlowBalance } from '../utils/getBalance';
import { cardBorderColours } from '../utils/constants';
import { Helmet } from 'react-helmet-async';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import AggregatorV2V3Interface from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/interfaces/AggregatorV2V3Interface.sol/AggregatorV2V3Interface.json';

const cardBorderRandom = cardBorderColours[(cardBorderColours.length * Math.random()) | 0];

export default function Send({ appSettings, setAppSettings }: any) {
  const { uuid } = useParams();
  const [flow, setFlow] = useState({} as FlowType);
  const [flowTotalBalance, setFlowTotalBalance] = useState('0');
  const [openAddressQRCode, setOpenAddressQRCode] = useState(false);
  const [selectedPaymentNetwork, setSelectedPaymentNetwork] = useState('');
  const [selectedPaymentAddress, setSelectedPaymentAddress] = useState('');
  const [topUpAmount, setTopUpAmount] = useState(BigInt(0));
  const [, /* comment */ setComment] = useState('');

  const { data: ensName } = useEnsName({
    address: flow.account,
    chainId: 1
  });

  const { data: avatar } = useEnsAvatar({
    name: ensName,
    chainId: 1
  });

  const { isSuccess: isEnsSuccess, data: ethUsdPriceFeedAddress } = useEnsAddress({
    name: 'eth-usd.data.eth',
    chainId: 1,
    cacheTime: 60_000
  });

  const { data: ethUsdPrice } = useContractRead({
    enabled: isEnsSuccess && ethUsdPriceFeedAddress !== undefined,
    chainId: 1,
    address: ethUsdPriceFeedAddress ?? undefined,
    abi: AggregatorV2V3Interface.abi,
    functionName: 'latestAnswer',
    select: (data) => Number(formatUnits(data as bigint, 8)),
    cacheTime: 60_000
  });

  const publicClient = usePublicClient();
  const { chains, switchNetwork } = useSwitchNetwork();

  const { config } = usePrepareSendTransaction({
    enabled: selectedPaymentAddress !== undefined,
    to: selectedPaymentAddress,
    value: topUpAmount
    //data: toHex(comment)
  });

  const { isSuccess, isError, data, sendTransaction } = useSendTransaction(config);

  const [txHash, setTxHash] = useState<Hash>();

  const sendToastId = useRef<Id>();

  useMemo(async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/flows/${uuid}`,
        { withCredentials: true }
      );

      setFlow(response.data);
    } catch (error) {
      console.error(error);
    }
  }, [uuid]);

  useMemo(async () => {
    if (selectedPaymentNetwork) {
      const address = flow.wallets.find((w) => w.network === selectedPaymentNetwork)?.address;
      if (address) {
        setSelectedPaymentAddress(address);
      }
    } else {
      setSelectedPaymentAddress('');
    }
  }, [selectedPaymentNetwork]);

  useMemo(async () => {
    if (isSuccess) {
      setTxHash(data?.hash);
    } else if (isError) {
      if (sendToastId.current) {
        toast.update(sendToastId.current, {
          render: `Payment failed! 😕`,
          type: 'error',
          isLoading: false,
          autoClose: 5000
        });
        sendToastId.current = undefined;
      }
    }
  }, [isSuccess, isError, data]);

  useMemo(async () => {
    updateFlowTotalBalance(flow);
  }, [flow]);

  async function updateFlowTotalBalance(flow: FlowType) {
    if (flow && flow.wallets && flow.wallets.length > 0 && ethUsdPrice) {
      setFlowTotalBalance(await getFlowBalance(flow, chains, ethUsdPrice));
    }
  }

  useMemo(async () => {
    if (txHash) {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash
      });

      console.log('Receipt: ', receipt);

      if (receipt && receipt.status === 'success') {
        if (sendToastId.current) {
          toast.update(sendToastId.current, {
            render: `Payment confirmed!`,
            type: 'success',
            isLoading: false,
            autoClose: 5000
          });
          sendToastId.current = undefined;
          updateFlowTotalBalance(flow);
        }
      } else {
        if (sendToastId.current) {
          toast.update(sendToastId.current, {
            render: `Payment failed! 😕`,
            type: 'error',
            isLoading: false,
            autoClose: 5000
          });
          sendToastId.current = undefined;
        }
      }
    }
  }, [txHash]);

  return (
    <CustomThemeProvider darkMode={appSettings.darkMode}>
      <Helmet>
        <title> PayFlow | Pay </title>
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
            width: 500,
            height: 650,
            border: 2,
            borderColor: cardBorderRandom,
            borderRadius: 5
          }}>
          {flow && flow.account && (
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
                    <AddressAvatar address={flow.account} />
                  )}
                  <Typography ml={1} variant="subtitle2">
                    {ensName ? ensName : shortenWalletAddressLabel(flow.account)}
                  </Typography>
                  <Tooltip title="Copy Address">
                    <IconButton
                      size="small"
                      onClick={() => {
                        copyToClipboard(flow.account);
                        toast.success('Address is copied!');
                      }}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Card>
              </Divider>

              <Typography variant="h5"> ${flowTotalBalance} USD</Typography>
              <Typography variant="h6" maxHeight={50} overflow="scroll">
                {flow.title}
              </Typography>
              <Typography variant="subtitle2" maxHeight={50} overflow="scroll">
                {flow.description}
              </Typography>

              <Divider flexItem sx={{ my: 3 }} />

              <Autocomplete
                autoHighlight
                fullWidth
                onChange={(_event, value) => {
                  if (value) {
                    switchNetwork?.(chains.find((c) => c?.name === value)?.id);
                    setSelectedPaymentNetwork(value);
                  } else {
                    setSelectedPaymentNetwork('');
                  }
                }}
                options={flow.wallets.flatMap((wallet) => wallet.network)}
                renderInput={(params) => (
                  <TextField variant="outlined" {...params} label="Choose Payment Network" />
                )}
                sx={{ '& fieldset': { borderRadius: 3 } }}
              />

              {selectedPaymentNetwork && (
                <>
                  <Box mt={1} display="flex" flexDirection="row" alignItems="center">
                    <Avatar
                      src={'/networks/' + selectedPaymentNetwork + '.png'}
                      sx={{ width: 24, height: 24 }}
                    />
                    <Typography ml={1}>
                      {shortenWalletAddressLabel(selectedPaymentAddress)}
                    </Typography>
                    <Tooltip title="Copy Address">
                      <IconButton
                        size="small"
                        onClick={() => {
                          copyToClipboard(selectedPaymentAddress);
                          toast.success('Address is copied!');
                        }}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Show QR">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setOpenAddressQRCode(true);
                        }}>
                        <QrCode2 fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </>
              )}

              <Divider flexItem sx={{ my: 3 }} />

              <TextField
                fullWidth
                variant="outlined"
                label="Top Up Amount"
                id="sendAmount"
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
                  inputMode: 'decimal',
                  sx: { borderRadius: 3 }
                }}
                onChange={(event) => {
                  setTopUpAmount(parseEther(event.target.value));
                }}
              />

              <TextField
                fullWidth
                id="sendComment"
                label="Comment (optional)"
                InputProps={{
                  inputMode: 'text',
                  inputProps: { maxLength: 32 },
                  sx: { borderRadius: 3 }
                }}
                onChange={(event) => {
                  setComment(event.target.value);
                }}
                sx={{ mt: 1 }}
              />

              <Divider flexItem sx={{ my: 2 }}>
                <Button
                  disabled={!sendTransaction}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  color="primary"
                  onClick={() => {
                    sendToastId.current = toast.loading(
                      `Sending ${formatEther(topUpAmount)} to ${shortenWalletAddressLabel(
                        selectedPaymentAddress
                      )} 💸`
                    );
                    sendTransaction?.();
                  }}
                  sx={{ mt: 1, borderRadius: 3 }}>
                  PAY
                </Button>
              </Divider>

              <AddressQRCodeDialog
                open={openAddressQRCode}
                address={selectedPaymentAddress}
                network={selectedPaymentNetwork}
                closeStateCallback={() => setOpenAddressQRCode(false)}
              />
            </Box>
          )}
        </Card>
      </Box>
    </CustomThemeProvider>
  );
}
