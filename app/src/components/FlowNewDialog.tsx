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
  Typography
} from '@mui/material';
import { toast } from 'react-toastify';

import { CloseCallbackType } from '../types/CloseCallbackType';
import axios from 'axios';
import { useAccount, useNetwork } from 'wagmi';
import { useState } from 'react';
import { smartAccountCompatibleChains } from '../utils/smartAccountCompatibleChains';

export type FlowNewDialogProps = DialogProps & CloseCallbackType;

export default function FlowNewDialog({ closeStateCallback, ...props }: FlowNewDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [paymentOnLoggedAddress, setPaymentOnLoggedAddress] = useState(true);
  const [paymentNetworks, setPaymentNetworks] = useState([] as string[]);

  const { address } = useAccount();
  const { chains } = useNetwork();

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  async function submitFlow() {
    const title = (window.document.getElementById('flowTitle') as HTMLInputElement).value;
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
      <DialogTitle>New Flow</DialogTitle>
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
          />
          <TextField
            id="flowDesc"
            label="Description"
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
            label="Receive On Logged External Account"
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
                onChange={(event, value) => {
                  setPaymentNetworks(value);
                }}
                options={chains
                  .filter((c) => !smartAccountCompatibleChains().includes(c.name))
                  .map((c) => c.name)}
                renderInput={(params) => (
                  <TextField
                    variant="outlined"
                    {...params}
                    label="Supported External Account Networks"
                  />
                )}
                sx={{ '& fieldset': { borderRadius: 3 } }}
              />
            </>
          )}
          <Button
            fullWidth
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
