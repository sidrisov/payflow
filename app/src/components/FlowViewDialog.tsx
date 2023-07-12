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
import { useMemo, useState } from 'react';
import { getTotalBalance, getWalletBalance } from '../utils/getFlowBalance';
import {
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
  useSwitchNetwork
} from 'wagmi';
import {
  AutoFixHigh,
  ContentCopy,
  DeleteForever,
  Download,
  Edit} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { shortenWalletAddressLabel } from '../utils/address';
import { copyToClipboard } from '../utils/copyToClipboard';
import { encodeAbiParameters, formatEther, keccak256, parseAbiParameters, toHex } from 'viem';

import PayFlowMasterFactoryArtifact from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/PayFlowMasterFactory.sol/PayFlowMasterFactory.json';
import { readContract } from 'wagmi/actions';
import { zkSyncTestnet } from 'wagmi/chains';
import { smartAccountCompatibleChains } from '../utils/smartAccountCompatibleChains';
import axios from 'axios';
import create2Address from '../utils/create2Address';

export type FlowViewDialogProps = DialogProps &
  CloseCallbackType & {
    flow: FlowType;
  };

const ZKSYNC_AA_FACTORY_ADDRESS = import.meta.env.VITE_PAYFLOW_ZKSYNC_AA_FACTORY_ADDRESS;

export default function FlowViewDialog({ closeStateCallback, ...props }: FlowViewDialogProps) {
  const flow = props.flow;

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [flowTotalBalance, setFlowTotalBalance] = useState('0');
  const [walletBalances, setWalletBalances] = useState([] as string[]);

  const [editFlow, setEditFlow] = useState(false);

  const [availableNetworksToAddAccount, setAvailableNetworksToAddAccount] = useState(
    [] as string[]
  );
  const [newAccountNetwork, setNewAccountNetwork] = useState('');
  const [newAccountAddress, setNewAccountAddress] = useState('');
  const [flowSalt, setFlowSalt] = useState('' as `0x${string}`);

  const { chains, switchNetwork } = useSwitchNetwork();

  const { address } = useAccount();

  const { config } = usePrepareContractWrite({
    address: ZKSYNC_AA_FACTORY_ADDRESS,
    abi: PayFlowMasterFactoryArtifact.abi,
    functionName: 'deployAccount',
    args: [flowSalt, address, address],
    chainId: zkSyncTestnet.id
  });
  const { isSuccess, write } = useContractWrite(config);

  useMemo(async () => {
    if (flow && flow.wallets) {
      if (flow.wallets.length > 0) {
        const balances = (
          await Promise.all(
            flow.wallets.map(async (wallet) => {
              return getWalletBalance(wallet, chains);
            })
          )
        ).map((result) => result.value);

        setWalletBalances(
          balances.map((balance) => (parseFloat(formatEther(balance)) * 1850).toFixed(1))
        );

        setFlowTotalBalance(
          (parseFloat(formatEther(await getTotalBalance(balances))) * 1850).toFixed(1)
        );
      }
      setFlowSalt(keccak256(toHex(flow.uuid)));
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

  function handleCloseCampaignDialog() {
    setEditFlow(false);
    setNewAccountNetwork('');
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

      console.log(playFlowContractHash);

      const playFlowAddress = create2Address(
        ZKSYNC_AA_FACTORY_ADDRESS,
        playFlowContractHash,
        flowSalt,
        encodedData
      );

      setNewAccountAddress(playFlowAddress);
    }
  }, [isSuccess]);

  async function submitFlowAccount() {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/flows/${flow.uuid}/wallet`,
        {
          address: newAccountAddress,
          network: newAccountNetwork,
          smart: smartAccountCompatibleChains().includes(newAccountNetwork)
        }
      );
      console.log(response.status);
      toast.success(`Successfully added new account: ${newAccountAddress}`);
    } catch (error) {
      console.log(error);
      toast.error('Try again!');
    }

    handleCloseCampaignDialog();
  }

  async function deleteExternalAccount(wallet: FlowWalletType) {
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
      toast.success(`Successfully deleted external account: ${wallet.address}`);
    } catch (error) {
      console.log(error);
      toast.error('Operation failed!');
    }

    handleCloseCampaignDialog();
  }

  return (
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

          {flow && flow.wallets && flow.wallets.filter((wallet) => wallet.smart).length > 0 && (
            <>
              <Divider flexItem>
                <Typography variant="subtitle2"> PayFlow Accounts </Typography>
              </Divider>
              {flow.wallets
                .filter((wallet) => wallet.smart)
                .map((wallet, index) => (
                  <Box
                    mt={1}
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    alignSelf="stretch"
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
                    <Typography variant="subtitle2">${walletBalances[index]}</Typography>
                  </Box>
                ))}
            </>
          )}

          {flow && flow.wallets && flow.wallets.filter((wallet) => !wallet.smart).length > 0 && (
            <>
              <Divider flexItem>
                <Typography variant="subtitle2"> External Accounts </Typography>
              </Divider>
              {flow.wallets
                .filter((wallet) => !wallet.smart)
                .map((wallet, index) => (
                  <Box
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
                      <Typography variant="subtitle2">${walletBalances[index]}</Typography>
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

          {editFlow &&
            (availableNetworksToAddAccount.length > 0 ? (
              <>
                <Divider flexItem>
                  <Typography variant="subtitle2">Add New Account</Typography>
                </Divider>
                <Autocomplete
                  autoHighlight
                  fullWidth
                  id="externalAccountNetwork"
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
                      id="externalAccountAddress"
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
                        onClick={() => {
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
          {!editFlow && (
            <Stack direction="row" alignSelf="flex-end">
              <IconButton
                size="small"
                color="inherit"
                onClick={() => {
                  setEditFlow(!editFlow);
                }}>
                <Edit fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="inherit"
                onClick={() => {
                  toast.error('Feature not supported yet!');
                }}>
                <Download fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="inherit"
                onClick={() => {
                  toast.error('Feature not supported yet!');
                }}>
                <DeleteForever fontSize="small" />
              </IconButton>
            </Stack>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
