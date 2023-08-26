import {
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  useTheme,
  DialogProps,
  Typography,
  Stack,
  Divider,
  Avatar,
  Box,
  IconButton,
  Button,
  Autocomplete,
  TextField,
  Tooltip,
  FormControlLabel,
  Switch
} from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { FlowType, FlowWalletType } from '../types/FlowType';
import { useContext, useMemo, useRef, useState } from 'react';
import { convertToUSD, getTotalBalance } from '../utils/getBalance';
import {
  useContractWrite,
  usePrepareContractWrite,
  usePublicClient,
  useSwitchNetwork
} from 'wagmi';
import {
  Add,
  AutoFixHigh,
  Close,
  ContentCopy,
  DeleteForever,
  Download,
  Edit,
  Share
} from '@mui/icons-material';
import { Id, toast } from 'react-toastify';
import { shortenWalletAddressLabel } from '../utils/address';
import { copyToClipboard } from '../utils/copyToClipboard';
import {
  Address,
  Hash,
  encodeAbiParameters,
  formatEther,
  keccak256,
  parseAbiParameters,
  toHex
} from 'viem';

import PayFlowFactoryArtifact from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/PayFlowFactory.sol/PayFlowFactory.json';
import { readContract } from 'wagmi/actions';
import axios from 'axios';
import create2Address from '../utils/create2Address';
import FlowWithdrawalDialog from './FlowWithdrawalDialog';
import ShareDialog from './ShareDialog';
import { UserContext } from '../contexts/UserContext';
import { networks } from '../utils/constants';
import { zkSyncTestnet } from 'wagmi/chains';
import { useEthersSigner } from '../utils/hooks/useEthersSigner';
import { SafeAccountConfig } from '@safe-global/protocol-kit';
import { safeDeploy } from '../utils/safeTransactions';
import { isRelaySupported } from '../utils/relayer';

const DAPP_URL = import.meta.env.VITE_PAYFLOW_SERVICE_DAPP_URL;
export type FlowViewDialogProps = DialogProps &
  CloseCallbackType & {
    flow?: FlowType;
  };

const ZKSYNC_PAYFLOW_FACTORY_ADDRESS = import.meta.env.VITE_ZKSYNC_PAYFLOW_FACTORY_ADDRESS;

export default function FlowViewDialog({ closeStateCallback, ...props }: FlowViewDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const flow = props.flow;
  const saltNonce = flow && flow.uuid ? keccak256(toHex(flow.uuid)) : undefined;

  const { chains, switchNetwork } = useSwitchNetwork();
  const publicClient = usePublicClient();
  const ethersSigner = useEthersSigner();

  const { walletBalances, smartAccountAllowedChains, accounts, ethUsdPrice } =
    useContext(UserContext);
  const [flowTotalBalance, setFlowTotalBalance] = useState('0');

  const [editFlow, setEditFlow] = useState(false);
  const [addFlowWallet, setAddFlowWallet] = useState(false);
  const [withdrawFlowWallet, setWithdrawFlowWallet] = useState(false);
  const [openWithdrawalDialog, setOpenWithdrawalDialog] = useState(false);
  const [selectedWithdrawalWallet, setSelectedWithdrawalWallet] = useState({} as FlowWalletType);
  const [masterAccount, setMasterAccount] = useState<Address>();

  const [isZkSyncNetwork, setZkSyncNetwork] = useState<boolean>();
  const [deployable, setDeployable] = useState<boolean>(false);
  const [deployed, setDeployed] = useState<boolean>();

  const [sponsored, setSponsored] = useState<boolean>();
  const [sponsarable, setSponsarable] = useState<boolean>();

  const [availableNetworksToAddAccount, setAvailableNetworksToAddAccount] = useState(
    [] as string[]
  );
  const [newAccountNetwork, setNewAccountNetwork] = useState<string>();
  const [newAccountAddress, setNewAccountAddress] = useState<string>();

  const [openFlowShare, setOpenFlowShare] = useState(false);
  const [flowShareInfo, setFlowShareInfo] = useState({} as { title: string; link: string });

  const { config } = usePrepareContractWrite({
    enabled: isZkSyncNetwork === true,
    address: ZKSYNC_PAYFLOW_FACTORY_ADDRESS,
    abi: PayFlowFactoryArtifact.abi,
    functionName: 'deployContract',
    args: [saltNonce, masterAccount],
    chainId: zkSyncTestnet.id
  });
  const { isSuccess, data, write } = useContractWrite(config);
  const [txHash, setTxHash] = useState<Hash>();

  const newWalletToastId = useRef<Id>();

  const safeDeployCallback = (txHash: string | undefined): void => {
    if (!txHash) {
      toast.error('Returned Tx Hash with error!');
      return;
    }
    setTxHash(txHash as Hash);
  };

  function shortNetworkName(network: string) {
    return networks.find((n) => n.chainId === chains.find((c) => c.name === network)?.id)
      ?.shortName;
  }

  useMemo(async () => {
    if (flow && flow.wallets && walletBalances && ethUsdPrice) {
      const balances = flow.wallets
        .map((wallet) => {
          return walletBalances.get(`${wallet.address}_${wallet.network}`);
        })
        .filter((balance) => balance) as bigint[];

      setFlowTotalBalance(
        (parseFloat(formatEther(await getTotalBalance(balances))) * ethUsdPrice).toFixed(1)
      );
    }
  }, [flow]);

  useMemo(async () => {
    if (flow && flow.wallets && chains) {
      const addedNetworks = flow.wallets.map((wallet) => wallet.network);
      setAvailableNetworksToAddAccount(
        chains.filter((c) => !addedNetworks.includes(c.name)).map((c) => c.name)
      );
    }
  }, [flow, chains]);

  useMemo(async () => {
    const chainId = chains.find((c) => c.name === newAccountNetwork)?.id;
    setSponsarable(isRelaySupported(chainId));
    setSponsored(isRelaySupported(chainId));

    setZkSyncNetwork(newAccountNetwork ? chainId === zkSyncTestnet.id : undefined);
  }, [newAccountNetwork]);

  useMemo(async () => {
    setDeployable(
      isZkSyncNetwork !== undefined && (isZkSyncNetwork === false || write !== undefined)
    );
  }, [isZkSyncNetwork, write]);

  async function deployNewWallet() {
    newWalletToastId.current = toast.loading('Creating Wallet 🪄');

    if (isZkSyncNetwork) {
      write?.();
    } else {
      if (ethersSigner && masterAccount && saltNonce) {
        const safeAccountConfig: SafeAccountConfig = {
          owners: [masterAccount],
          threshold: 1
        };

        const safeAddress = await safeDeploy({
          ethersSigner,
          safeAccountConfig,
          saltNonce,
          sponsored,
          callback: safeDeployCallback
        });

        if (safeAddress) {
          setNewAccountAddress(safeAddress);
        } else {
          toast.update(newWalletToastId.current, {
            render: 'Wallet Creation Failed 😕',
            type: 'error',
            isLoading: false,
            autoClose: 5000
          });
          newWalletToastId.current = undefined;
        }
      }
    }
  }

  function resetViewState() {
    setEditFlow(false);
    setAddFlowWallet(false);
    setWithdrawFlowWallet(false);
    setNewAccountNetwork(undefined);
    setNewAccountAddress(undefined);
    setDeployable(false);
    setDeployed(false);
  }

  function handleCloseCampaignDialog() {
    resetViewState();
    closeStateCallback();
  }

  useMemo(async () => {
    if (accounts && newAccountNetwork) {
      setMasterAccount(accounts.find((a) => a.network === newAccountNetwork)?.address);
    }
  }, [accounts, newAccountNetwork]);

  useMemo(async () => {
    if (isSuccess && masterAccount && saltNonce) {
      const encodedData = encodeAbiParameters(parseAbiParameters('address'), [
        masterAccount as `0x${string}`
      ]);

      const playFlowContractHash = (await readContract({
        address: ZKSYNC_PAYFLOW_FACTORY_ADDRESS,
        abi: PayFlowFactoryArtifact.abi,
        chainId: chains.find((c) => c?.name === newAccountNetwork)?.id,
        functionName: 'bytecodeHash'
      })) as `0x${string}`;

      const playFlowAddress = create2Address(
        ZKSYNC_PAYFLOW_FACTORY_ADDRESS,
        playFlowContractHash,
        saltNonce,
        encodedData
      );

      setNewAccountAddress(playFlowAddress);
      setTxHash(data?.hash);
    }
  }, [isSuccess, data]);

  useMemo(async () => {
    if (txHash && newAccountAddress) {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash
      });

      console.log('Receipt: ', receipt);

      if (receipt && receipt.status === 'success') {
        if (newWalletToastId.current) {
          setDeployable(false);
          setDeployed(true);
          toast.update(newWalletToastId.current, {
            render: `Wallet ${shortenWalletAddressLabel(newAccountAddress)} created 🚀`,
            type: 'success',
            isLoading: false,
            autoClose: 5000
          });
          newWalletToastId.current = undefined;
        }
      } else {
        if (newWalletToastId.current) {
          toast.update(newWalletToastId.current, {
            render: 'Wallet Creation Failed 😕',
            type: 'error',
            isLoading: false,
            autoClose: 5000
          });
          newWalletToastId.current = undefined;
        }
      }
    }
  }, [txHash, newAccountAddress]);

  async function submitWallet() {
    if (flow && newAccountNetwork) {
      try {
        const flowWallet = {
          address: newAccountAddress,
          network: newAccountNetwork,
          smart: smartAccountAllowedChains.includes(newAccountNetwork),
          // decide based on network, since other than zkSync all other support Safe
          safe: smartAccountAllowedChains.includes(newAccountNetwork) && !isZkSyncNetwork,
          master: smartAccountAllowedChains.includes(newAccountNetwork) ? masterAccount : null
        } as FlowWalletType;
        const response = await axios.post(
          `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/flows/${flow.uuid}/wallet`,
          flowWallet,
          { withCredentials: true }
        );
        console.log(response.status);

        const wallets = Array.from(flow.wallets);
        wallets.push(flowWallet);
        flow.wallets = wallets;
        toast.success(`Wallet ${shortenWalletAddressLabel(newAccountAddress)} added!`);
      } catch (error) {
        console.log(error);
        toast.error('Try again!');
      }

      resetViewState();
    }
  }

  async function deleteExternalAccount(wallet: FlowWalletType) {
    if (flow) {
      try {
        const response = await axios.delete(
          `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/flows/${flow.uuid}/wallet`,
          {
            data: {
              address: wallet.address,
              network: wallet.network
            },
            withCredentials: true
          }
        );
        console.log(response.status);

        const wallets = flow.wallets.filter(
          (w) => !(w.address === wallet.address && w.network === wallet.network)
        );

        flow.wallets = wallets;

        toast.success(`Wallet ${shortenWalletAddressLabel(wallet.address)} removed!`);
      } catch (error) {
        console.log(error);
        toast.error('Operation failed!');
      }

      resetViewState();
    }
  }

  return flow ? (
    <Dialog
      fullScreen={fullScreen}
      onClose={handleCloseCampaignDialog}
      {...props}
      PaperProps={{ sx: { borderRadius: 5 } }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Stack spacing={1} direction="row" justifyContent="center" alignItems="center">
          <Typography justifySelf="center" variant="h6">
            {flow.title}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ minWidth: 350, maxWidth: 400 }}>
        <Stack direction="column" spacing={2} alignItems="center">
          <Typography variant="subtitle2" alignSelf="center">
            {flow.description}
          </Typography>
          <Typography variant="h5"> 💸 ${flowTotalBalance}</Typography>

          {flow.wallets && flow.wallets.filter((wallet) => wallet.smart).length > 0 && (
            <>
              <Divider flexItem>
                <Typography variant="subtitle2"> Payflow Wallets </Typography>
              </Divider>
              {flow.wallets
                .filter((wallet) => wallet.smart)
                .map((wallet, index) => (
                  <Box
                    key={`flow_view_${flow.uuid}_smart_wallet_${index}`}
                    mt={1}
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    alignSelf="stretch"
                    justifyContent="space-between">
                    <Box
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      flexGrow={1}
                      justifyContent="space-between"
                      sx={{ border: 1, borderRadius: 3, p: 1 }}>
                      <Box display="flex" flexDirection="row" alignItems="center">
                        <Tooltip title={wallet.network}>
                          <Avatar
                            src={'/networks/' + wallet.network + '.png'}
                            sx={{ width: 24, height: 24 }}
                          />
                        </Tooltip>
                        <Typography ml={1}>{shortenWalletAddressLabel(wallet.address)}</Typography>
                        <Tooltip title="Copy Address">
                          <IconButton
                            size="small"
                            onClick={() => {
                              copyToClipboard(wallet.address);
                              toast.success('Address is copied!');
                            }}>
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {wallet.safe && (
                          <Tooltip title="Open in Safe Web Wallet">
                            <a
                              href={`https://app.safe.global/home?safe=${shortNetworkName(
                                wallet.network
                              )}:${wallet.address}`}
                              target="_blank">
                              <Avatar src="/safe.png" sx={{ width: 16, height: 16 }} />
                            </a>
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant="subtitle2">
                        $
                        {convertToUSD(
                          walletBalances?.get(`${wallet.address}_${wallet.network}`),
                          ethUsdPrice
                        )}
                      </Typography>
                    </Box>
                    {withdrawFlowWallet && (
                      <Tooltip title="Withdraw">
                        <IconButton
                          size="small"
                          onClick={async () => {
                            setSelectedWithdrawalWallet(wallet);
                            setOpenWithdrawalDialog(true);
                          }}>
                          <Download fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                ))}
            </>
          )}

          {flow.wallets && flow.wallets.filter((wallet) => !wallet.smart).length > 0 && (
            <>
              <Divider flexItem>
                <Typography variant="subtitle2"> External Wallets </Typography>
              </Divider>
              {flow.wallets
                .filter((wallet) => !wallet.smart)
                .map((wallet, index) => (
                  <Box
                    key={`flow_view_${flow.uuid}_external_wallet_${index}`}
                    mt={1}
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    alignSelf="stretch"
                    justifyContent="space-between">
                    <Box
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      flexGrow={1}
                      justifyContent="space-between"
                      sx={{ border: 1, borderRadius: 3, p: 1 }}>
                      <Box display="flex" flexDirection="row" alignItems="center">
                        <Avatar
                          src={'/networks/' + wallet.network + '.png'}
                          sx={{ width: 24, height: 24 }}
                        />
                        <Typography ml={1}>{shortenWalletAddressLabel(wallet.address)}</Typography>
                        <Tooltip title="Copy Address">
                          <IconButton
                            size="small"
                            onClick={() => {
                              copyToClipboard(wallet.address);
                              toast.success('Address is copied!');
                            }}>
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="subtitle2">
                        $
                        {convertToUSD(
                          walletBalances?.get(`${wallet.address}_${wallet.network}`),
                          ethUsdPrice
                        )}
                      </Typography>
                    </Box>
                    {editFlow && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          deleteExternalAccount(wallet);
                        }}>
                        <DeleteForever fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
            </>
          )}

          {withdrawFlowWallet &&
            flow.wallets &&
            flow.wallets.filter((wallet) => wallet.smart).length === 0 && (
              <Typography>You can withdraw only from Payflow Wallets</Typography>
            )}

          {addFlowWallet &&
            (availableNetworksToAddAccount.length > 0 ? (
              <>
                <Divider flexItem>
                  <Typography variant="subtitle2">Add New Wallet</Typography>
                </Divider>
                <Autocomplete
                  autoHighlight
                  fullWidth
                  id="accountNetwork"
                  onChange={(_event, value) => {
                    if (value) {
                      setNewAccountNetwork(value);
                      // switch network only for smart accounts,
                      // as those will require signing transaction
                      if (smartAccountAllowedChains.includes(value)) {
                        switchNetwork?.(chains.find((c) => c?.name === value)?.id);
                      }
                    } else {
                      setNewAccountNetwork('');
                      setNewAccountAddress('');
                    }
                  }}
                  options={availableNetworksToAddAccount}
                  renderInput={(params) => (
                    <TextField variant="outlined" {...params} label="Choose Wallet Network" />
                  )}
                  sx={{ '& fieldset': { borderRadius: 3 } }}
                />

                {newAccountNetwork &&
                  (!smartAccountAllowedChains.includes(newAccountNetwork) ? (
                    <TextField
                      fullWidth
                      id="accountAddress"
                      label="External Wallet Address"
                      onChange={(event) => {
                        setNewAccountAddress(event.target.value);
                      }}
                      InputProps={{ inputProps: { maxLength: 42 }, sx: { borderRadius: 3 } }}
                    />
                  ) : (
                    <>
                      <FormControlLabel
                        labelPlacement="end"
                        disabled={!sponsarable}
                        control={
                          <Switch
                            size="medium"
                            checked={sponsored}
                            onChange={() => {
                              setSponsored(!sponsored);
                            }}
                          />
                        }
                        label="Sponsored"
                        sx={{ alignSelf: 'flex-start' }}
                      />
                      <Button
                        fullWidth
                        disabled={!deployable}
                        variant="outlined"
                        size="large"
                        color="primary"
                        sx={{ borderRadius: 3 }}
                        endIcon={<AutoFixHigh />}
                        onClick={deployNewWallet}>
                        Create Payflow Wallet
                      </Button>
                      {deployed && <Typography variant="subtitle2">{newAccountAddress}</Typography>}
                    </>
                  ))}

                <Button
                  fullWidth
                  disabled={!deployed}
                  variant="outlined"
                  size="large"
                  color="primary"
                  sx={{ borderRadius: 3 }}
                  onClick={() => {
                    submitWallet();
                  }}>
                  SAVE
                </Button>
              </>
            ) : (
              <>
                <Typography>You added wallets for all networks</Typography>
              </>
            ))}
          {!(editFlow || addFlowWallet || withdrawFlowWallet) && (
            <Stack spacing={1} direction="row" alignSelf="center">
              <Tooltip title="Add Wallet">
                <IconButton
                  color="inherit"
                  onClick={() => {
                    setAddFlowWallet(!addFlowWallet);
                  }}
                  sx={{ border: 1, borderStyle: 'dashed' }}>
                  <Add fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share Link / QR">
                <span>
                <IconButton
                  color="inherit"
                  disabled={flow.wallets && flow.wallets.length === 0}
                  onClick={async () => {
                    setFlowShareInfo({
                      title: flow.title,
                      link: `${DAPP_URL}/send/${flow.uuid}`
                    });
                    setOpenFlowShare(true);
                  }}
                  sx={{ border: 1, borderStyle: 'dashed' }}>
                  <Share fontSize="small" />
                </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton
                  color="inherit"
                  onClick={() => {
                    setEditFlow(!editFlow);
                  }}
                  sx={{ border: 1, borderStyle: 'dashed' }}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Withdraw">
                <IconButton
                  color="inherit"
                  onClick={async () => {
                    setWithdrawFlowWallet(!withdrawFlowWallet);
                  }}
                  sx={{ border: 1, borderStyle: 'dashed' }}>
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Suspend">
                <IconButton
                  color="inherit"
                  onClick={async () => {
                    toast.error('Feature not supported yet!');
                  }}
                  sx={{ border: 1, borderStyle: 'dashed' }}>
                  <Close fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <FlowWithdrawalDialog
        open={openWithdrawalDialog}
        from={selectedWithdrawalWallet.address}
        to={selectedWithdrawalWallet.master}
        network={selectedWithdrawalWallet.network}
        closeStateCallback={async () => setOpenWithdrawalDialog(false)}
      />
      <ShareDialog
        open={openFlowShare}
        title={flowShareInfo.title}
        link={flowShareInfo.link}
        closeStateCallback={async () => setOpenFlowShare(false)}
      />
    </Dialog>
  ) : (
    <></>
  );
}
