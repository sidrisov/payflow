import { Address, Hash, formatUnits, parseUnits } from 'viem';

import {
  erc20ABI,
  useAccount,
  useBalance,
  useContractRead,
  useContractWrite,
  useEnsAddress,
  useEnsAvatar,
  useEnsName,
  usePrepareContractWrite,
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
import { ConnectButton } from '@rainbow-me/rainbowkit';
import HideOnScroll from '../components/HideOnScroll';
import { getFlowBalance } from '../utils/getBalance';
import { Helmet } from 'react-helmet-async';
import CustomThemeProvider from '../theme/CustomThemeProvider';
import AggregatorV2V3Interface from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/interfaces/AggregatorV2V3Interface.sol/AggregatorV2V3Interface.json';
import { ETH, Token, getSupportedTokens } from '../utils/erc20contracts';
import { API_URL } from '../utils/urlConstants';
import { comingSoonToast } from '../components/Toasts';
import NetworkAvatar from '../components/NetworkAvatar';
import { getNetworkDisplayName } from '../utils/networks';

export default function Send({ appSettings, setAppSettings }: any) {
  const { uuid } = useParams();
  const [flow, setFlow] = useState({} as FlowType);
  const [flowTotalBalance, setFlowTotalBalance] = useState('0');
  const [openAddressQRCode, setOpenAddressQRCode] = useState(false);
  const [selectedPaymentNetwork, setSelectedPaymentNetwork] = useState<number>();
  const [selectedPaymentAddress, setSelectedPaymentAddress] = useState<Address>();
  const [selectedPaymentToken, setSelectedPaymentToken] = useState<Token>();
  const [topUpAmount, setTopUpAmount] = useState(BigInt(0));
  const [, /* comment */ setComment] = useState('');

  const { data: ensName } = useEnsName({
    address: flow.owner,
    chainId: 1,
    cacheTime: 300_000
  });

  const { data: avatar } = useEnsAvatar({
    name: ensName,
    chainId: 1,
    cacheTime: 300_000
  });

  const { isSuccess: isEnsSuccess, data: ethUsdPriceFeedAddress } = useEnsAddress({
    name: 'eth-usd.data.eth',
    chainId: 1,
    cacheTime: 300_000
  });

  const { data: ethUsdPrice } = useContractRead({
    enabled: isEnsSuccess && ethUsdPriceFeedAddress !== undefined,
    chainId: 1,
    address: ethUsdPriceFeedAddress ?? undefined,
    abi: AggregatorV2V3Interface.abi,
    functionName: 'latestAnswer',
    select: (data) => Number(formatUnits(data as bigint, 8)),
    cacheTime: 10_000
  });

  const publicClient = usePublicClient();
  const { switchNetwork } = useSwitchNetwork();

  const { address } = useAccount();

  const { isSuccess: isBalanceSuccess, data: balance } = useBalance({
    enabled: address !== undefined && selectedPaymentToken !== undefined,
    address,
    token: selectedPaymentToken !== ETH ? selectedPaymentToken?.address : undefined
  });

  const { config } = usePrepareSendTransaction({
    enabled: selectedPaymentAddress !== undefined && selectedPaymentToken !== undefined,
    to: selectedPaymentAddress,
    value: topUpAmount
    //data: toHex(comment)
  });

  const { isSuccess, isError, data, sendTransaction } = useSendTransaction(config);

  const { config: erc20TransferConfig } = usePrepareContractWrite({
    enabled:
      address !== undefined && selectedPaymentToken !== undefined && selectedPaymentToken !== ETH,
    address: selectedPaymentToken?.address,
    abi: erc20ABI,
    functionName: 'transfer',
    args: selectedPaymentAddress ? [selectedPaymentAddress, topUpAmount] : undefined
  });
  const {
    isSuccess: isErc20TransferSuccess,
    isError: isErc20TransferError,
    data: erc20TransferTxData,
    write
  } = useContractWrite(erc20TransferConfig);

  const [txHash, setTxHash] = useState<Hash>();

  const sendToastId = useRef<Id>();

  useMemo(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/flows/${uuid}`, { withCredentials: true });

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
      setSelectedPaymentAddress(undefined);
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
    if (isErc20TransferSuccess) {
      setTxHash(erc20TransferTxData?.hash);
    } else if (isErc20TransferError) {
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
  }, [isErc20TransferSuccess, isErc20TransferError, erc20TransferTxData]);

  useMemo(async () => {
    updateFlowTotalBalance(flow);
  }, [flow]);

  async function updateFlowTotalBalance(flow: FlowType) {
    if (flow && flow.wallets && flow.wallets.length > 0 && ethUsdPrice) {
      setFlowTotalBalance(await getFlowBalance(flow, ethUsdPrice));
    }
  }

  useMemo(async () => {
    if (txHash) {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash
      });

      console.debug('Receipt: ', receipt);

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
        <title> Payflow | Pay </title>
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
          elevation={5}
          sx={{
            p: 5,
            width: 500,
            height: 650,
            border: 3,
            borderRadius: 5,
            borderStyle: 'double',
            borderColor: 'divider'
          }}>
          {flow && flow.owner && (
            <Box display="flex" flexDirection="column" alignItems="center">
              <Divider flexItem sx={{ my: 1 }}>
                <Card
                  elevation={5}
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
                    <AddressAvatar address={flow.owner} />
                  )}
                  <Typography ml={1} variant="subtitle2">
                    {ensName ? ensName : shortenWalletAddressLabel(flow.owner)}
                  </Typography>
                  <Tooltip title="Copy Address">
                    <IconButton
                      size="small"
                      onClick={() => {
                        copyToClipboard(flow.owner);
                        toast.success('Address is copied!');
                      }}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Card>
              </Divider>
              <Typography variant="h5"> ${flowTotalBalance} USD</Typography>
              <Typography variant="h6" maxHeight={50} overflow="auto">
                {flow.title}
              </Typography>
              <Typography variant="subtitle2" maxHeight={50} overflow="auto">
                {flow.description}
              </Typography>
              <Divider flexItem sx={{ my: 3 }} />
              <Autocomplete
                autoHighlight
                fullWidth
                onChange={(_event, value) => {
                  if (value) {
                    switchNetwork?.(value.network);
                    setSelectedPaymentNetwork(value.network);
                  } else {
                    setSelectedPaymentNetwork(undefined);
                  }
                }}
                options={flow.wallets}
                getOptionLabel={(wallet) => getNetworkDisplayName(wallet.network)}
                renderInput={(params) => (
                  <TextField variant="outlined" {...params} label="Select Payment Network" />
                )}
                sx={{ '& fieldset': { borderRadius: 3 } }}
              />
              {selectedPaymentNetwork && (
                <Box mt={1} display="flex" flexDirection="row" alignItems="center">
                  <NetworkAvatar network={selectedPaymentNetwork} sx={{ width: 24, height: 24 }} />
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
                        //setOpenAddressQRCode(true);
                        comingSoonToast();
                      }}>
                      <QrCode2 fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              {selectedPaymentNetwork && (
                <>
                  <Divider flexItem sx={{ my: 2 }} />

                  <Box display="flex" flexDirection="row" width="100%">
                    <TextField
                      fullWidth
                      variant="outlined"
                      label={`Top Up Amount (max: ${
                        selectedPaymentToken && isBalanceSuccess
                          ? balance &&
                            parseFloat(formatUnits(balance?.value, balance?.decimals)).toPrecision(
                              5
                            )
                          : 0
                      })`}
                      id="sendAmount"
                      type="number"
                      InputProps={{
                        inputMode: 'decimal',
                        sx: { borderRadius: 3, borderTopRightRadius: 0, borderBottomRightRadius: 0 }
                      }}
                      onChange={(event) => {
                        if (balance) {
                          const amount = parseUnits(event.target.value, balance?.decimals);
                          if (amount <= balance?.value) {
                            setTopUpAmount(amount);
                          } else {
                            setTopUpAmount(BigInt(0));
                          }
                        }
                      }}
                    />
                    <Autocomplete
                      autoHighlight
                      onChange={(_event, value) => {
                        if (value) {
                          setSelectedPaymentToken(value);
                        } else {
                          setSelectedPaymentToken(undefined);
                          setTopUpAmount(BigInt(0));
                        }
                      }}
                      options={getSupportedTokens(selectedPaymentNetwork)}
                      getOptionLabel={(token) => token.name}
                      renderInput={(params) => (
                        <TextField variant="outlined" {...params} label="Token" />
                      )}
                      sx={{
                        '& fieldset': {
                          borderRadius: 3,
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0
                        },
                        width: 200
                      }}
                    />
                  </Box>

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
                      disabled={!(sendTransaction || write) || !topUpAmount}
                      fullWidth
                      variant="outlined"
                      size="medium"
                      color="primary"
                      onClick={() => {
                        // TODO: replace with fetch info for the token and use metadata
                        if (balance) {
                          sendToastId.current = toast.loading(
                            `Sending ${formatUnits(topUpAmount, balance?.decimals)} ${
                              selectedPaymentToken?.name
                            } to ${shortenWalletAddressLabel(selectedPaymentAddress)}`
                          );
                          if (selectedPaymentToken === ETH) {
                            sendTransaction?.();
                          } else {
                            write?.();
                          }
                        }
                      }}
                      sx={{ mt: 1, borderRadius: 3 }}>
                      PAY
                    </Button>
                  </Divider>
                </>
              )}
              // TODO: refactor this
              {/* {selectedPaymentAddress && selectedPaymentNetwork && (
                <WalletQRCodeShareDialog
                  open={openAddressQRCode}
                  address={selectedPaymentAddress}
                  network={selectedPaymentNetwork}
                  closeStateCallback={() => setOpenAddressQRCode(false)}
                />
              )} */}
            </Box>
          )}
        </Card>
      </Box>
    </CustomThemeProvider>
  );
}
