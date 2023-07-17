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
  Switch,
  FormControlLabel,
  Autocomplete,
  Typography,
  Box
} from '@mui/material';
import { toast } from 'react-toastify';

import { CloseCallbackType } from '../types/CloseCallbackType';
import axios from 'axios';
import { useAccount, useNetwork } from 'wagmi';
import { useContext, useState } from 'react';
import { UserContext } from '../contexts/UserContext';

export type FlowNewDialogProps = DialogProps & CloseCallbackType;

export default function FlowNewDialog({ closeStateCallback, ...props }: FlowNewDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { address } = useAccount();
  const { chains } = useNetwork();

  const { smartAccountAllowedChains } = useContext(UserContext);

  const [title, setTitle] = useState<string>();
  const [paymentOnLoggedAddress, setPaymentOnLoggedAddress] = useState(false);
  const [paymentNetworks, setPaymentNetworks] = useState([] as string[]);

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  async function submitFlow() {
    const description = (window.document.getElementById('flowDesc') as HTMLInputElement).value;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/flows`,
        {
          account: address,
          title: title,
          description: description,
          wallets: paymentOnLoggedAddress
            ? paymentNetworks.map((network) => ({
                address: address,
                network: network,
                smart: false
              }))
            : []
        }
      );
      console.log(response.status);
      toast.success(`Successfully uploaded a flow: ${title}`);
    } catch (error) {
      console.log(error);
      toast.error('Try again!');
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
        <Box display="flex" justifyContent="center">
          <Typography variant="h6">New Flow</Typography>
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
          <TextField
            id="flowTitle"
            label="Title"
            fullWidth
            InputProps={{ inputProps: { maxLength: 32 }, sx: { borderRadius: 3 } }}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
          />
          <TextField
            id="flowDesc"
            label="Description (optional)"
            fullWidth
            multiline
            minRows={1}
            maxRows={3}
            InputProps={{ inputProps: { maxLength: 128 }, sx: { borderRadius: 3 } }}
          />
          <FormControlLabel
            labelPlacement="end"
            control={
              <Switch
                size="medium"
                checked={paymentOnLoggedAddress}
                onChange={() => {
                  setPaymentOnLoggedAddress(!paymentOnLoggedAddress);
                }}
              />
            }
            label="Receive on logged wallet"
          />
          {paymentOnLoggedAddress && (
            <>
              <Typography variant="body2" overflow="clip">
                {address}
              </Typography>
              <Autocomplete
                multiple
                autoHighlight
                fullWidth
                onChange={(_event, value) => {
                  setPaymentNetworks(value);
                }}
                options={chains
                  .filter((c) => !smartAccountAllowedChains.includes(c.name))
                  .map((c) => c.name)}
                renderInput={(params) => (
                  <TextField
                    variant="outlined"
                    {...params}
                    label="Supported External Wallet Networks"
                  />
                )}
                sx={{ '& fieldset': { borderRadius: 3 } }}
              />
            </>
          )}
          <Button
            fullWidth
            disabled={!title}
            variant="outlined"
            size="large"
            color="primary"
            sx={{ borderRadius: 3 }}
            onClick={() => {
              submitFlow();
            }}>
            Create
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
