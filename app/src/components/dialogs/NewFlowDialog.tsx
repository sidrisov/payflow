import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogProps,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { ProfileType } from '../../types/ProfileType';
import { BackDialogTitle } from './BackDialogTitle';
import { LoadingConnectWalletButton } from '../buttons/LoadingConnectWalletButton';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { base } from 'viem/chains';

import { createSiweMessage, generateSiweNonce } from 'viem/siwe';
import { Address } from 'viem';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'react-toastify';
import { useMobile } from '../../utils/hooks/useMobile';
export type NewFlowDialogProps = DialogProps &
  CloseCallbackType & {
    profile: ProfileType;
  };

export default function NewFlowDialog({
  closeStateCallback,
  profile,
  ...props
}: NewFlowDialogProps) {
  const isMobile = useMobile();

  const account = useAccount();

  const { connectWallet, isModalOpen } = usePrivy();

  const { data: signer, isSuccess } = useWalletClient();

  const publicClient = usePublicClient();

  function handleCloseCampaignDialog() {
    closeStateCallback();
  }

  return (
    <Dialog
      disableEnforceFocus
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
      <BackDialogTitle
        showOnDesktop
        title="New Payment Flow"
        closeStateCallback={closeStateCallback}
      />

      <DialogContent>
        <Box>
          <Typography>{account?.address}</Typography>
        </Box>

        {publicClient && signer && (
          <Button
            onClick={async () => {
              connectWallet({ suggestedAddress: '0x0dEe77c83cB8b14fA95497825dF93202AbF6ad83' });

              const message = createSiweMessage({
                address: signer.account.address as Address,
                chainId: base.id,
                domain: 'example.com',
                nonce: generateSiweNonce(),
                uri: 'https://example.com/path',
                version: '1'
              });

              const signature = await signer.signMessage({ account: signer.account, message });
              const valid = await publicClient.verifySiweMessage({
                message,
                signature
              });

              toast.info(`Verification resulst: ${valid} for message: ${message} `);
            }}>
            Verify
          </Button>
        )}
        <LoadingConnectWalletButton />
      </DialogContent>
    </Dialog>
  );
}
