import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogProps,
  Stack,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  Button
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { optimism } from 'viem/chains';
import { glideClient } from '../../utils/glide';
import { CurrenciesByChain } from '@paywithglide/glide-js';
import { useSwitchChain, useSendTransaction, usePublicClient, useChainId } from 'wagmi';
import { rentStorageAbi } from '../../utils/abi/rentFcStorageAbi';
import { OP_FARCASTER_STORAGE_CONTRACT_ADDR } from '../../utils/contracts';

export type GiftStorageDialog = DialogProps &
  CloseCallbackType & {
    title: string;
  };

export default function GiftStorageDialog({
  title,
  closeStateCallback,
  ...props
}: GiftStorageDialog) {
  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();

  const publicClient = usePublicClient({ chainId: optimism.id });

  const submitGlideTransaction = async () => {
    try {
      const rentUnitPrice = await publicClient?.readContract({
        address: OP_FARCASTER_STORAGE_CONTRACT_ADDR,
        abi: rentStorageAbi,
        functionName: 'price',
        args: [1n]
      });

      const txHash = await glideClient.writeContract({
        account: '0x0dEe77c83cB8b14fA95497825dF93202AbF6ad83',
        paymentCurrency: CurrenciesByChain.BaseMainnet.USDC,
        currentChainId: chainId,
        chainId: optimism.id,
        address: OP_FARCASTER_STORAGE_CONTRACT_ADDR,
        abi: rentStorageAbi,
        functionName: 'rent',
        args: [100n, 1n],
        value: rentUnitPrice,
        switchChainAsync,
        sendTransactionAsync: async (tx) => {
          console.log('Glide tnxs: ', tx);
          return await sendTransactionAsync(tx);
        }
      });
    } catch (error) {
      console.log('Error', error);
    }
  };

  return (
    <Dialog
      onClose={handleCloseCampaignDialog}
      {...props}
      PaperProps={{
        sx: {
          ...(!isMobile && {
            borderRadius: 5
          })
        }
      }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <DialogTitle>
        <Box display="flex" justifyContent="center">
          <Typography variant="h6" sx={{ overflow: 'auto' }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
        <Stack m={1} direction="column" spacing={3}>
          <Button onClick={submitGlideTransaction}>Gift</Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
