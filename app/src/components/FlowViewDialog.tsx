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
  useAccount,
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
import { Hash, encodeAbiParameters, formatEther, keccak256, parseAbiParameters, toHex } from 'viem';

import PayFlowMasterFactoryArtifact from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/PayFlowMasterFactory.sol/PayFlowMasterFactory.json';
import { readContract } from 'wagmi/actions';
import { zkSyncTestnet } from 'wagmi/chains';
import { smartAccountCompatibleChains } from '../utils/smartAccountCompatibleChains';
import axios from 'axios';
import create2Address from '../utils/create2Address';
import FlowWithdrawalDialog from './FlowWithdrawalDialog';
import FlowShareDialog from './FlowShareDialog';
import { UserContext } from '../contexts/UserContext';

export type FlowViewDialogProps = DialogProps &
  CloseCallbackType & {
    flow: FlowType;
  };

const ZKSYNC_AA_FACTORY_ADDRESS = import.meta.env.VITE_PAYFLOW_ZKSYNC_AA_FACTORY_ADDRESS;

export default function FlowViewDialog({ closeStateCallback, ...props }: FlowViewDialogProps) {
  const flow = props.flow;
  const flowSalt = props.flow.uuid ? keccak256(toHex(props.flow.uuid)) : undefined;

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [flowTotalBalance, setFlowTotalBalance] = useState('0');
  const { walletBalances } = useContext(UserContext);

  const [editFlow, setEditFlow] = useState(false);
  const [addFlowWallet, setAddFlowWallet] = useState(false);
  const [withdrawFlowWallet, setWithdrawFlowWallet] = useState(false);
  const [openWithdrawalDialog, setOpenWithdrawalDialog] = useState(false);
  const [selectedWithdrawalWallet, setSelectedWithdrawalWallet] = useState({} as FlowWalletType);

  const [availableNetworksToAddAccount, setAvailableNetworksToAddAccount] = useState(
    [] as string[]
  );
  const [newAccountNetwork, setNewAccountNetwork] = useState('');
  const [newAccountAddress, setNewAccountAddress] = useState('');

  const { chains, switchNetwork } = useSwitchNetwork();
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const [openFlowShare, setOpenFlowShare] = useState(false);
  const [flowShareInfo, setFlowShareInfo] = useState({} as { title: string; link: string });

  const { config } = usePrepareContractWrite({
    address: ZKSYNC_AA_FACTORY_ADDRESS,
    abi: PayFlowMasterFactoryArtifact.abi,
    functionName: 'deployAccount',
    args: [flowSalt, address, address],
    chainId: zkSyncTestnet.id
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
        (parseFloat(formatEther(await getTotalBalance(balances))) * 1850).toFixed(1)
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
  }

  function handleCloseCampaignDialog() {
    resetViewState();
    closeStateCallback();
  }

  useMemo(async () => {
    if (isSuccess && address && flowSalt) {
      const encodedData = encodeAbiParameters(parseAbiParameters('address, address'), [
        address as `0x${string}`,
        address as `0x${string}`
      ]);

      const playFlowContractHash = (await readContract({
        address: ZKSYNC_AA_FACTORY_ADDRESS,
        abi: PayFlowMasterFactoryArtifact.abi,
        chainId: zkSyncTestnet.id,
        functionName: 'aaBytecodeHash'
      })) as `0x${string}`;

      const playFlowAddress = create2Address(
        ZKSYNC_AA_FACTORY_ADDRESS,
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
          toast.success('Payflow Account Successfully Deployed!');
        } else {
          toast.error('Payflow Account Failed To Deploy!');
        }
      }
    }
  }, [txHash]);

  async function submitFlowAccount() {
    if (flow) {
      try {
        const flowWallet = {
          address: newAccountAddress,
          network: newAccountNetwork,
          smart: smartAccountCompatibleChains().includes(newAccountNetwork)
        } as FlowWalletType;
        const response = await axios.post(
          `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/flows/${flow.uuid}/wallet`,
          flowWallet
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
            }
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
      <DialogContent sx={{ minWidth: 350 }}>
        <Stack direction="column" spacing={2} alignItems="center">
          <Typography variant="subtitle2" alignSelf="center">
            {flow.description}
          </Typography>
          <Typography variant="h5"> 💸 ${flowTotalBalance}</Typography>

          {flow.wallets && flow.wallets.filter((wallet) => wallet.smart).length > 0 && (
            <>
              <Divider flexItem>
                <Typography variant="subtitle2"> PayFlow Accounts </Typography>
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
                          src={'/public/networks/' + wallet.network + '.png'}
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
                          1850
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
                <Typography variant="subtitle2"> External Accounts </Typography>
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
                          src={'/public/networks/' + wallet.network + '.png'}
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
                          1850
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
              <Typography>You can withdraw only from PayFlow Accounts</Typography>
            )}

          {addFlowWallet &&
            (availableNetworksToAddAccount.length > 0 ? (
              <>
                <Divider flexItem>
                  <Typography variant="subtitle2">Add New Account</Typography>
                </Divider>
                <Autocomplete
                  autoHighlight
                  fullWidth
                  id="accountNetwork"
                  onChange={(event, value) => {
                    if (value) {
                      setNewAccountNetwork(value);
                      // switch netwrok only for smart accounts,
                      // as those will require signing transaction
                      if (smartAccountCompatibleChains().includes(value)) {
                        switchNetwork?.(chains.find((c) => c?.name === value)?.id);
                      }
                    } else {
                      setNewAccountNetwork('');
                      setNewAccountAddress('');
                    }
                  }}
                  options={availableNetworksToAddAccount}
                  renderInput={(params) => (
                    <TextField variant="outlined" {...params} label="Choose Account Network" />
                  )}
                  sx={{ '& fieldset': { borderRadius: 3 } }}
                />

                {newAccountNetwork.length > 0 &&
                  (!smartAccountCompatibleChains().includes(newAccountNetwork) ? (
                    <TextField
                      fullWidth
                      id="accountAddress"
                      label="External Account Address"
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
                        Create PayFlow Account
                      </Button>
                      {newAccountAddress && <Typography>{newAccountAddress}</Typography>}
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
                <Typography>You have configured accounts for all networks</Typography>
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
                    link: `http://app.payflow.me:5173/send/${flow.uuid}`
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
        title="Withdrawal"
        from={selectedWithdrawalWallet.address}
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
