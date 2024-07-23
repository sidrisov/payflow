import {
  Box,
  Dialog,
  DialogContent,
  DialogProps,
  Stack,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { SelectedIdentityType } from '../../types/ProfleType';
import { BackDialogTitle } from './BackDialogTitle';
import { PaymentType } from '../../types/PaymentType';
import { SenderField } from '../SenderField';
import { KeyboardDoubleArrowDown } from '@mui/icons-material';
import { RecipientField } from '../RecipientField';
import { useMemo, useState } from 'react';
import { TokenAmountSection } from './TokenAmountSection';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { LoadingPaymentButton } from '../buttons/LoadingPaymentButton';
import { useCompatibleWallets, useToAddress } from '../../utils/hooks/useCompatibleWallets';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { Token } from '../../utils/erc20contracts';
import { useChainId } from 'wagmi';
import { SUPPORTED_CHAINS } from '@privy-io/react-auth';
import { submitPayment } from '../../services/payments';
import { toast } from 'react-toastify';
import { FARCASTER_DAPP } from '../../utils/dapps';
import { useSearchParams } from 'react-router-dom';

export type PaymentSenderType = 'payflow' | 'wallet' | 'none';

export type PaymentDialogProps = DialogProps &
  CloseCallbackType & {
    paymentType?: PaymentSenderType;
    payment?: PaymentType;
    sender: SelectedIdentityType;
    recipient: SelectedIdentityType;
  } & { setOpenSearchIdentity?: React.Dispatch<React.SetStateAction<boolean>> };

export default function PayComposerActionDialog({
  payment,
  sender,
  recipient,
  closeStateCallback,
  setOpenSearchIdentity,
  ...props
}: PaymentDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get('access_token') ?? undefined;

  const compatibleWallets = useCompatibleWallets({
    sender:
      sender.identity.profile?.defaultFlow ??
      ({
        wallets: SUPPORTED_CHAINS.map((chain) => {
          return { address: sender.identity.address, network: chain.id } as FlowWalletType;
        })
      } as FlowType),
    recipient
  });
  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>();
  const [selectedToken, setSelectedToken] = useState<Token>();

  const chainId = useChainId();

  const [sendAmount, setSendAmount] = useState<number | undefined>(payment?.tokenAmount);
  const [sendAmountUSD, setSendAmountUSD] = useState<number | undefined>(payment?.usdAmount);

  const [paymentEnabled, setPaymentEnabled] = useState<boolean>(false);

  const toAddress = useToAddress({ recipient, selectedWallet });

  useMemo(async () => {
    if (compatibleWallets.length === 0) {
      setSelectedWallet(undefined);
      return;
    }
    setSelectedWallet(compatibleWallets.find((w) => w.network === chainId) ?? compatibleWallets[0]);
  }, [compatibleWallets, chainId]);

  useMemo(async () => {
    setPaymentEnabled(Boolean(toAddress && sendAmount));
  }, [toAddress, sendAmount]);

  return (
    <Dialog
      disableEnforceFocus
      fullScreen={isMobile}
      onClose={closeStateCallback}
      {...props}
      PaperProps={{
        sx: {
          ...(!isMobile && {
            width: 375,
            borderRadius: 5,
            height: 600
          })
        }
      }}
      sx={{
        backdropFilter: 'blur(5px)'
      }}>
      <BackDialogTitle title="Pay" closeStateCallback={closeStateCallback} />
      <DialogContent
        sx={{
          p: 2
        }}>
        <Box
          height="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="space-between">
          {sender && (
            <Stack spacing={1} alignItems="center" width="100%">
              <SenderField sender={sender} displayFlow={false} />
              <KeyboardDoubleArrowDown />
              <RecipientField recipient={recipient} setOpenSearchIdentity={setOpenSearchIdentity} />
            </Stack>
          )}

          {selectedWallet && (
            <>
              <TokenAmountSection
                selectedWallet={selectedWallet}
                selectedToken={selectedToken}
                sendAmount={sendAmount}
                setSendAmount={setSendAmount}
                sendAmountUSD={sendAmountUSD}
                setSendAmountUSD={setSendAmountUSD}
                balanceCheck={false}
              />
              <NetworkTokenSelector
                selectedWallet={selectedWallet}
                setSelectedWallet={setSelectedWallet}
                selectedToken={selectedToken}
                setSelectedToken={setSelectedToken}
                compatibleWallets={compatibleWallets}
                showBalance={false}
              />
              <LoadingPaymentButton
                title="Create Payment"
                //loading={paymentPending}
                disabled={!paymentEnabled}
                onClick={async () => {
                  const newPayment = {
                    type: 'FRAME',
                    status: 'PENDING',
                    receiver: recipient.identity.profile,
                    receiverAddress: toAddress,
                    chainId: selectedToken?.chainId,
                    token: selectedToken?.id,
                    tokenAmount: sendAmount
                  } as PaymentType;

                  console.log('Submitting payment: ', newPayment);
                  const refId = await submitPayment(newPayment, accessToken);

                  if (!refId) {
                    toast.error('Failed to created payment frame, pls, contact @sinaver.eth 🙏🏻');
                    return;
                  }

                  window.parent.postMessage(
                    {
                      type: 'createCast',
                      data: {
                        cast: {
                          text: `Hey, @${
                            recipient.identity.meta?.socials.find(
                              (s) => s.dappName === FARCASTER_DAPP
                            )?.profileName
                          } paying you with the frame`,
                          embeds: [encodeURI(`https://frames.payflow.me/payment/${refId}`)]
                        }
                      }
                    },
                    '*'
                  );
                }}
              />
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
