import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  useMediaQuery,
  useTheme,
  DialogProps,
  Stack,
  Autocomplete,
  Typography,
  Box
} from '@mui/material';

import { CloseCallbackType } from '../types/CloseCallbackType';
import {
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
  usePublicClient,
  useSwitchNetwork
} from 'wagmi';
import { useMemo, useState } from 'react';
import { AutoFixHigh } from '@mui/icons-material';
import { Hash, encodeAbiParameters, keccak256, parseAbiParameters, toHex } from 'viem';
import PayFlowMasterFactoryArtifact from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/PayFlowMasterFactory.sol/PayFlowMasterFactory.json';
import { zkSyncTestnet } from 'viem/chains';
import { readContract } from 'wagmi/actions';
import create2Address from '../utils/create2Address';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AccountType } from '../types/AccountType';

export type AccountNewDialogProps = DialogProps &
  CloseCallbackType & {
    networks: string[];
  };

const ZKSYNC_AA_FACTORY_ADDRESS = import.meta.env.VITE_ZKSYNC_MASTER_PAYFLOW_FACTORY_ADDRESS;
const ZKSYNC_CREATE2_SALT_IV = import.meta.env.VITE_ZKSYNC_CREATE2_SALT_IV;
export default function FlowNewDialog({ closeStateCallback, ...props }: AccountNewDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { chains, switchNetwork } = useSwitchNetwork();

  const flowSalt = address ? keccak256(toHex(ZKSYNC_CREATE2_SALT_IV.concat(address))) : undefined;

  const [newAccountAddress, setNewAccountAddress] = useState('');
  const [newAccountNetwork, setNewAccountNetwork] = useState('');

  const { config } = usePrepareContractWrite({
    enabled: newAccountNetwork.length > 0,
    address: ZKSYNC_AA_FACTORY_ADDRESS,
    abi: PayFlowMasterFactoryArtifact.abi,
    functionName: 'deployAccount',
    args: [flowSalt, address, address],
    chainId: chains.find((c) => c.name === newAccountNetwork)?.id
  });
  const { isSuccess, data, write } = useContractWrite(config);

  const [txHash, setTxHash] = useState<Hash>();

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

      console.log(playFlowAddress);

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

  async function submitAccount() {
    try {
      const account = {
        userId: address,
        address: newAccountAddress,
        network: newAccountNetwork
      } as AccountType;

      const response = await axios.post(
        `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/accounts?userId=${address}`,
        account
      );
      console.log(response.status);

      toast.success(`Successfully added new account: ${newAccountAddress}`);
    } catch (error) {
      console.log(error);
      toast.error('Try again!');
    }

    handleCloseCampaignDialog();
  }

  function handleCloseCampaignDialog() {
    setNewAccountNetwork('');
    setNewAccountAddress('');
    closeStateCallback();
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
        <Box display="flex" justifyContent="center">
          <Typography variant="h6">New Account</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack
          m={1}
          direction="column"
          spacing={2}
          component="form"
          id="flow"
          sx={{ minWidth: 300, maxWidth: 350 }}>
          <Autocomplete
            autoHighlight
            fullWidth
            id="accountNetwork"
            onChange={(_event, value) => {
              if (value) {
                setNewAccountNetwork(value);
                switchNetwork?.(chains.find((c) => c?.name === value)?.id);
              } else {
                setNewAccountNetwork('');
                setNewAccountAddress('');
              }
            }}
            options={props.networks}
            renderInput={(params) => (
              <TextField variant="outlined" {...params} label="Choose Account Network" />
            )}
            sx={{ '& fieldset': { borderRadius: 3 } }}
          />

          {newAccountNetwork && (
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
          )}
          {newAccountAddress && <Typography variant="subtitle2">{newAccountAddress}</Typography>}

          <Button
            fullWidth
            disabled={!newAccountNetwork || !newAccountAddress}
            variant="outlined"
            size="large"
            color="primary"
            sx={{ borderRadius: 3 }}
            onClick={() => {
              submitAccount();
            }}>
            SAVE
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
