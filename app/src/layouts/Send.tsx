import '@rainbow-me/rainbowkit/styles.css';
import 'react-toastify/dist/ReactToastify.css';

import { Hash, parseEther, toHex } from 'viem';

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
  Typography
} from '@mui/material';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
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
import { cardBorderColours, ethPrice } from '../utils/constants';

const cardBorderRandom = cardBorderColours[(cardBorderColours.length * Math.random()) | 0];

export default function Send({ appSettings, setAppSettings }: any) {
  const { uuid } = useParams();
  const [flow, setFlow] = useState({} as FlowType);
  const [flowTotalBalance, setFlowTotalBalance] = useState('0');
  const [openAddressQRCode, setOpenAddressQRCode] = useState(false);
  const [selectedPaymentNetwork, setSelectedPaymentNetwork] = useState('');
  const [selectedPaymentAddress, setSelectedPaymentAddress] = useState('');
  const [topUpAmount, setTopUpAmount] = useState(BigInt(0));
  const [comment, setComment] = useState('');

  const publicClient = usePublicClient();
  const { chains, switchNetwork } = useSwitchNetwork();
  const { config } = usePrepareSendTransaction({
    enabled: selectedPaymentAddress !== undefined,
    to: selectedPaymentAddress,
    value: topUpAmount,
    data: toHex(comment)
  });

  const [txHash, setTxHash] = useState<Hash>();

  const { data: ensName } = useEnsName({
    address: flow.account,
    chainId: 1
  });

  const { data: avatar } = useEnsAvatar({
    name: ensName,
    chainId: 1
  });

  const { isSuccess, data, sendTransaction } = useSendTransaction(config);

  useMemo(async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/flows/${uuid}`
      );

      console.log(response.data);

      setFlow(response.data);
    } catch (error) {
      console.log(error);
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
    if (isSuccess === true) {
      setTxHash(data?.hash);
      toast.success('Payment was submitted!');
    }
  }, [isSuccess, data]);

  useMemo(async () => {
    updateFlowTotalBalance(flow);
  }, [flow]);

  async function updateFlowTotalBalance(flow: FlowType) {
    if (flow && flow.wallets && flow.wallets.length > 0) {
      setFlowTotalBalance(await getFlowBalance(flow, chains, ethPrice));
    }
  }

  useMemo(async () => {
    if (txHash) {
      // TODO: add loading indicator
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash
      });

      console.log('Receipt: ', receipt);

      if (receipt) {
        if (receipt.status === 'success') {
          updateFlowTotalBalance(flow);
          toast.success('Payment Confirmed!');
        } else {
          toast.error('Payment Failed!');
        }
      }
    }
  }, [txHash]);

  return (
    <>
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
        sx={{
          my: '5%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
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
                  <IconButton
                    size="small"
                    onClick={() => {
                      copyToClipboard(flow.account);
                      toast.success('Wallet address is copied to clipboard!');
                    }}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
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
                  setSelectedPaymentNetwork(value as string);
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
                      src={'/public/networks/' + selectedPaymentNetwork + '.png'}
                      sx={{ width: 24, height: 24 }}
                    />
                    <Typography ml={1}>
                      {shortenWalletAddressLabel(selectedPaymentAddress)}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        copyToClipboard(selectedPaymentAddress);
                        toast.success('Wallet address is copied to clipboard!');
                      }}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setOpenAddressQRCode(true);
                      }}>
                      <QrCode2 fontSize="small" />
                    </IconButton>
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
                    if (sendTransaction) {
                      switchNetwork?.(chains.find((c) => c?.name === selectedPaymentNetwork)?.id);
                      sendTransaction?.();
                    }
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
    </>
  );
}
