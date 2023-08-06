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
  TextField
} from '@mui/material';
import { CloseCallbackType } from '../types/CloseCallbackType';
import { FlowType, FlowWalletType } from '../types/FlowType';
import { useContext, useMemo, useState } from 'react';
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
import { toast } from 'react-toastify';
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
import FlowShareDialog from './FlowShareDialog';
import { UserContext } from '../contexts/UserContext';
import { ethPrice } from '../utils/constants';

const DAPP_URL = import.meta.env.VITE_PAYFLOW_SERVICE_DAPP_URL;
export type FlowViewDialogProps = DialogProps &
  CloseCallbackType & {
    flow: FlowType;
  };

const ZKSYNC_PAYFLOW_FACTORY_ADDRESS = import.meta.env.VITE_ZKSYNC_PAYFLOW_FACTORY_ADDRESS;

export default function FlowViewDialog({ closeStateCallback, ...props }: FlowViewDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const flow = props.flow;
  const flowSalt = props.flow.uuid ? keccak256(toHex(props.flow.uuid)) : undefined;

  const { walletBalances, smartAccountAllowedChains } = useContext(UserContext);
  const { accounts } = useContext(UserContext);

  const [flowTotalBalance, setFlowTotalBalance] = useState('0');

  const [editFlow, setEditFlow] = useState(false);
  const [addFlowWallet, setAddFlowWallet] = useState(false);
  const [withdrawFlowWallet, setWithdrawFlowWallet] = useState(false);
  const [openWithdrawalDialog, setOpenWithdrawalDialog] = useState(false);
  const [selectedWithdrawalWallet, setSelectedWithdrawalWallet] = useState({} as FlowWalletType);
  const [masterAccount, setMasterAccount] = useState<Address>();

  const [availableNetworksToAddAccount, setAvailableNetworksToAddAccount] = useState(
    [] as string[]
  );
  const [newAccountNetwork, setNewAccountNetwork] = useState<string>();
  const [newAccountAddress, setNewAccountAddress] = useState<string>();

  const { chains, switchNetwork } = useSwitchNetwork();
  const publicClient = usePublicClient();

  const [openFlowShare, setOpenFlowShare] = useState(false);
  const [flowShareInfo, setFlowShareInfo] = useState({} as { title: string; link: string });

  const { config } = usePrepareContractWrite({
    enabled: newAccountNetwork !== undefined,
    address: ZKSYNC_PAYFLOW_FACTORY_ADDRESS,
    abi: PayFlowFactoryArtifact.abi,
    functionName: 'deployContract',
    args: [flowSalt, masterAccount],
    chainId: chains.find((c) => c?.name === newAccountNetwork)?.id
  });
  const { isSuccess, data, write } = useContractWrite(config);
  const [txHash, setTxHash] = useState<Hash>();

  useMemo(async () => {
    if (flow && flow.wallets && walletBalances) {
      const balances = flow.wallets
        .map((wallet) => {
          return walletBalances.get(`${wallet.address}_${wallet.network}`);
        })
        .filter((balance) => balance) as bigint[];

      setFlowTotalBalance(
        (parseFloat(formatEther(await getTotalBalance(balances))) * ethPrice).toFixed(1)
      );
    }
  }, [flow.wallets]);

  useMemo(async () => {
    if (flow && flow.wallets && chains) {
      const addedNetworks = flow.wallets.map((wallet) => wallet.network);
      setAvailableNetworksToAddAccount(
        chains.filter((c) => !addedNetworks.includes(c.name)).map((c) => c.name)
      );
    }
  }, [flow.wallets, chains]);

  function resetViewState() {
    setEditFlow(false);
    setAddFlowWallet(false);
    setWithdrawFlowWallet(false);
    setNewAccountNetwork('');
    setNewAccountAddress('');
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
    if (isSuccess && masterAccount && flowSalt) {
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
        flowSalt,
        encodedData
      );

      setNewAccountAddress(playFlowAddress);
      setTxHash(data?.hash);
    }
  }, [isSuccess, data]);

  useMemo(async () => {
    if (txHash) {
      // TODO: add loading indicator
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash
      });

      console.log('Receipt: ', receipt);

      if (receipt) {
        if (receipt.status === 'success') {
          toast.success('Payflow Wallet Successfully Deployed!');
        } else {
          toast.error('Payflow Wallet Failed To Deploy!');
        }
      }
    }
  }, [txHash]);

  async function submitFlowAccount() {
    if (flow && newAccountNetwork) {
      try {
        const flowWallet = {
          address: newAccountAddress,
          network: newAccountNetwork,
          smart: smartAccountAllowedChains.includes(newAccountNetwork),
          master: masterAccount
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
        toast.success(`Successfully added new account: ${newAccountAddress}`);
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

        toast.success(`Successfully removed ${wallet.address} from the flow!`);
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
                        <Avatar
                          src={'/networks/' + wallet.network + '.png'}
                          sx={{ width: 24, height: 24 }}
                        />
                        <Typography ml={1}>{shortenWalletAddressLabel(wallet.address)}</Typography>
                        <IconButton
                          size="small"
                          onClick={() => {
                            copyToClipboard(wallet.address);
                            toast.success('Wallet address is copied to clipboard!');
                          }}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography variant="subtitle2">
                        {convertToUSD(
                          walletBalances?.get(`${wallet.address}_${wallet.network}`),
                          ethPrice
                        )}
                      </Typography>
                    </Box>
                    {withdrawFlowWallet && (
                      <IconButton
                        size="small"
                        onClick={async () => {
                          setSelectedWithdrawalWallet(wallet);
                          setOpenWithdrawalDialog(true);
                        }}>
                        <Download fontSize="small" />
                      </IconButton>
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
                        <IconButton
                          size="small"
                          onClick={() => {
                            copyToClipboard(wallet.address);
                            toast.success('Wallet address is copied to clipboard!');
                          }}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography variant="subtitle2">
                        $
                        {convertToUSD(
                          walletBalances?.get(`${wallet.address}_${wallet.network}`),
                          ethPrice
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
                      // switch netwrok only for smart accounts,
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
                      <Button
                        fullWidth
                        disabled={!write}
                        variant="outlined"
                        size="large"
                        color="primary"
                        sx={{ borderRadius: 3 }}
                        endIcon={<AutoFixHigh />}
                        onClick={async () => {
                          write?.();
                        }}>
                        Create Payflow Wallet
                      </Button>
                      {newAccountAddress && (
                        <Typography variant="subtitle2">{newAccountAddress}</Typography>
                      )}
                    </>
                  ))}

                <Button
                  fullWidth
                  disabled={!newAccountNetwork || !newAccountAddress}
                  variant="outlined"
                  size="large"
                  color="primary"
                  sx={{ borderRadius: 3 }}
                  onClick={() => {
                    submitFlowAccount();
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
              <IconButton
                color="inherit"
                onClick={() => {
                  setAddFlowWallet(!addFlowWallet);
                }}
                sx={{ border: 1, borderStyle: 'dashed' }}>
                <Add fontSize="small" />
              </IconButton>
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
              <IconButton
                color="inherit"
                onClick={() => {
                  setEditFlow(!editFlow);
                }}
                sx={{ border: 1, borderStyle: 'dashed' }}>
                <Edit fontSize="small" />
              </IconButton>
              <IconButton
                color="inherit"
                onClick={async () => {
                  setWithdrawFlowWallet(!withdrawFlowWallet);
                }}
                sx={{ border: 1, borderStyle: 'dashed' }}>
                <Download fontSize="small" />
              </IconButton>
              <IconButton
                color="inherit"
                onClick={async () => {
                  toast.error('Feature not supported yet!');
                }}
                sx={{ border: 1, borderStyle: 'dashed' }}>
                <Close fontSize="small" />
              </IconButton>
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
      <FlowShareDialog
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
