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
  Box,
  InputAdornment,
  IconButton
} from '@mui/material';
import { toast } from 'react-toastify';

import { CloseCallbackType } from '../types/CloseCallbackType';
import axios from 'axios';
import { useContext, useState } from 'react';
import { ProfileContext } from '../contexts/UserContext';
import { formatEther, parseEther } from 'viem';
import { FlowType, FlowWalletType } from '../types/FlowType';
import { ContentCopy } from '@mui/icons-material';
import { shortenWalletAddressLabel } from '../utils/address';
import { copyToClipboard } from '../utils/copyToClipboard';
import { PaymentRequestType } from '../types/PaymentRequestType';
import { API_URL } from '../utils/urlConstants';
import NetworkAvatar from './NetworkAvatar';
import { getNetworkDisplayName } from '../utils/networks';

export type RequestNewDialogProps = DialogProps & CloseCallbackType;

export default function RequestNewDialog({ closeStateCallback, ...props }: RequestNewDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    profile: { flows }
  } = useContext(ProfileContext);

  const [title, setTitle] = useState<string>();
  const [selectedFlow, setSelectedFlow] = useState<FlowType>();
  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>();

  const [amount, setAmount] = useState<bigint>();

  function handleCloseCampaignDialog() {
    setSelectedFlow(undefined);
    setSelectedWallet(undefined);
    setAmount(undefined);
    setTitle(undefined);

    closeStateCallback();
  }

  async function submitRequest() {
    if (title && selectedFlow && selectedWallet && amount) {
      const description = (window.document.getElementById('requestDesc') as HTMLInputElement).value;

      try {
        const response = await axios.post(
          `${API_URL}/api/requests`,
          {
            title: title,
            description: description,
            flowUuid: selectedFlow.uuid,
            network: selectedWallet.network,
            address: selectedWallet.address,
            amount: formatEther(amount)
          } as PaymentRequestType,
          { withCredentials: true }
        );
        console.debug(response.status);
        toast.success(`Payment request '${title}' created`);
      } catch (error) {
        console.error(error);
        toast.error('Try again!');
      }

      handleCloseCampaignDialog();
    }
  }

  return flows ? (
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
          <Typography variant="h6">New Payment Request</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack
          m={1}
          direction="column"
          spacing={2}
          component="form"
          id="request"
          sx={{ minWidth: 300, maxWidth: 350 }}>
          <TextField
            id="requestTitle"
            label="Title"
            fullWidth
            InputProps={{ inputProps: { maxLength: 32 }, sx: { borderRadius: 3 } }}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
          />
          <TextField
            id="requestDesc"
            label="Description (optional)"
            fullWidth
            multiline
            minRows={1}
            maxRows={3}
            InputProps={{ inputProps: { maxLength: 128 }, sx: { borderRadius: 3 } }}
          />
          <Autocomplete
            autoHighlight
            fullWidth
            onChange={(_event, value) => {
              if (value) {
                setSelectedFlow(value);
              } else {
                setSelectedFlow(undefined);
                setSelectedWallet(undefined);
              }
            }}
            options={flows}
            getOptionLabel={(option) => option.title}
            renderInput={(params) => (
              <TextField variant="outlined" {...params} label="Choose Payment Flow" />
            )}
            sx={{ '& fieldset': { borderRadius: 3 } }}
          />

          {selectedFlow && (
            <Autocomplete
              autoHighlight
              fullWidth
              onChange={(_event, value) => {
                if (value) {
                  setSelectedWallet(value);
                } else {
                  setSelectedWallet(undefined);
                }
              }}
              // allow only smart wallets
              options={selectedFlow.walletProvider ? selectedFlow.wallets : []}
              getOptionLabel={(option) => getNetworkDisplayName(option.network)}
              renderInput={(params) => (
                <TextField variant="outlined" {...params} label="Choose Payment Wallet" />
              )}
              sx={{ '& fieldset': { borderRadius: 3 } }}
            />
          )}

          {selectedWallet && (
            <Box
              mt={1}
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="center">
              <NetworkAvatar network={selectedWallet.network} sx={{ width: 24, height: 24 }} />
              <Typography ml={1}>{shortenWalletAddressLabel(selectedWallet.address)}</Typography>
              <IconButton
                size="small"
                onClick={() => {
                  copyToClipboard(selectedWallet.address);
                  toast.success('Address is copied!');
                }}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
          )}

          <TextField
            fullWidth
            variant="outlined"
            label="Amount"
            id="sendAmount"
            type="number"
            InputProps={{
              endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
              inputMode: 'decimal',
              sx: { borderRadius: 3 }
            }}
            onChange={(event) => {
              setAmount(parseEther(event.target.value));
            }}
          />
          <Button
            fullWidth
            disabled={!title || !selectedFlow || !selectedWallet || !amount}
            variant="outlined"
            size="large"
            color="primary"
            sx={{ borderRadius: 3 }}
            onClick={() => {
              submitRequest();
            }}>
            Create
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  ) : (
    <></>
  );
}
