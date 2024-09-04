import {
  Dialog,
  DialogContent,
  DialogProps,
  Stack,
  Box,
  useMediaQuery,
  useTheme,
  Typography,
  Skeleton,
  Avatar,
  Tooltip
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { degen } from 'viem/chains';
import { glideConfig } from '../../utils/glide';
import { useSwitchChain, useChainId, useAccount, useWalletClient, useClient } from 'wagmi';
import { BackDialogTitle } from './BackDialogTitle';
import { SenderField } from '../SenderField';
import { KeyboardDoubleArrowDown } from '@mui/icons-material';
import { SelectedIdentityType } from '../../types/ProfileType';
import { FarcasterRecipientField } from '../FarcasterRecipientField';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { PaymentType } from '../../types/PaymentType';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { useContext, useMemo, useState } from 'react';
import { Token } from '../../utils/erc20contracts';
import { Hash } from 'viem';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { useGlideEstimatePayment, useGlidePaymentOptions } from '../../utils/hooks/useGlidePayment';
import { ProfileContext } from '../../contexts/UserContext';
import { useSafeTransfer } from '../../utils/hooks/useSafeTransfer';
import { toast } from 'react-toastify';
import { Social } from '../../generated/graphql/types';
import { SafeAccountConfig } from '@safe-global/protocol-kit';
import { SafeVersion } from '@safe-global/safe-core-sdk-types';
import { updatePayment } from '../../services/payments';
import { grey, red } from '@mui/material/colors';
import { useRegularTransfer } from '../../utils/hooks/useRegularTransfer';
import { CAIP19, createSession, executeSession } from '@paywithglide/glide-js';
import { delay } from '../../utils/delay';
import { ChooseFlowDialog } from './ChooseFlowDialog';
import { UpSlideTransition } from './TransitionDownUpSlide';
import PoweredByGlideText from '../text/PoweredByGlideText';
import { useCompatibleWallets } from '../../utils/hooks/useCompatibleWallets';
import { MintMetadata } from '../../utils/mint';
import { useMintPaymentTx } from '../../utils/hooks/useMintPaymentTx';
import { PayButton } from '../buttons/PayButton';

export type MintDialogProps = DialogProps &
  CloseCallbackType & {
    sender: SelectedIdentityType;
    payment: PaymentType;
    social: Social;
    mint: MintMetadata;
  } & {
    alwaysShowBackButton?: boolean;
    flows?: FlowType[];
    selectedFlow?: FlowType;
    setSelectedFlow?: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  };

export default function MintDialog({
  alwaysShowBackButton = false,
  sender,
  payment,
  social,
  mint,
  closeStateCallback,
  flows,
  selectedFlow,
  setSelectedFlow,
  ...props
}: MintDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const [openSelectFlow, setOpenSelectFlow] = useState(false);

  const senderFlow = sender.identity.profile?.defaultFlow as FlowType;

  const isNativeFlow = senderFlow.type !== 'FARCASTER_VERIFICATION' && senderFlow.type !== 'LINKED';

  // force to display sponsored
  const [gasFee] = useState<bigint | undefined>(isNativeFlow ? BigInt(0) : undefined);

  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const { isConnected, address } = useAccount();

  console.log(isConnected, address);

  const { profile } = useContext(ProfileContext);

  const [paymentWallet, setPaymentWallet] = useState<FlowWalletType>();
  const [paymentToken, setPaymentToken] = useState<Token>();
  const [paymentPending, setPaymentPending] = useState<boolean>(false);

  const { data: signer } = useWalletClient();
  const client = useClient();

  const { loading, confirmed, error, status, txHash, transfer, reset } = useSafeTransfer();
  const {
    loading: loadingRegular,
    confirmed: confirmedRegular,
    error: errorRegular,
    status: statusRegular,
    txHash: txHashRegular,
    sendTransactionAsync,
    reset: resetRegular
  } = useRegularTransfer();

  const { data: mintData, isLoading: isMintLoading } = useMintPaymentTx({
    mint,
    minter: senderFlow.wallets[0].address,
    recipient: payment.receiverAddress,
    comment: `Minted for @${social.profileName} on @payflow`
  });

  const paymentTx = mintData?.paymentTx;
  const mintStatus = mintData?.mintStatus;

  console.log('Mint tx: ', paymentTx);

  const {
    isLoading: isPaymentOptionsLoading,
    data: paymentOptions,
    isError: isPaymentOptionsError
  } = useGlidePaymentOptions(Boolean(paymentTx) && mintStatus === 'live', {
    ...(paymentTx as any),
    account: senderFlow.wallets[0].address
  });

  console.log('Payment Options: ', paymentOptions);

  const { isLoading: isPaymentOptionLoading, data: paymentOption } = useGlideEstimatePayment(
    Boolean(paymentToken) && Boolean(paymentTx) && mintStatus === 'live',
    {
      paymentCurrency: `eip155:${paymentToken?.chainId}/${
        paymentToken?.tokenAddress
          ? `erc20:${paymentToken.tokenAddress}`
          : paymentToken?.chainId === degen.id
          ? 'slip44:33436'
          : 'slip44:60'
      }` as CAIP19,
      ...(paymentTx as any),
      account: senderFlow.wallets[0].address
    }
  );

  const compatibleWallets = useCompatibleWallets({
    sender: senderFlow,
    payment,
    paymentOptions: !isPaymentOptionsLoading ? paymentOptions : undefined
  });

  useMemo(async () => {
    if (compatibleWallets.length === 0) {
      setPaymentWallet(undefined);
      return;
    }
    setPaymentWallet(compatibleWallets.find((w) => w.network === chainId) ?? compatibleWallets[0]);
  }, [compatibleWallets, chainId]);

  const submitGlideTransaction = async () => {
    try {
      if (
        paymentTx &&
        profile &&
        client &&
        signer &&
        paymentWallet &&
        paymentToken &&
        paymentOption
      ) {
        if (isNativeFlow) {
          reset();
        } else {
          resetRegular();
        }

        const session = await createSession(glideConfig, {
          paymentCurrency: paymentOption.paymentCurrency,
          currentChainId: chainId,
          ...(paymentTx as any),
          account: paymentWallet.address
        });

        const { sponsoredTransactionHash: glideTxHash } = await executeSession(glideConfig, {
          session,
          currentChainId: chainId as any,
          switchChainAsync,
          sendTransactionAsync: async (tx) => {
            console.log('Glide tnxs: ', tx);

            let txHash;
            if (isNativeFlow) {
              // TODO: hard to figure out if there 2 signers or one, for now consider if signerProvider not specified - 1, otherwise - 2
              const owners = [];
              if (
                senderFlow.signerProvider &&
                senderFlow.signer.toLowerCase() !== profile.identity.toLowerCase()
              ) {
                owners.push(profile.identity);
              }
              owners.push(senderFlow.signer);

              const safeAccountConfig: SafeAccountConfig = {
                owners,
                threshold: 1
              };

              const saltNonce = senderFlow.saltNonce as string;
              const safeVersion = paymentWallet.version as SafeVersion;

              txHash = await transfer(
                client,
                signer,
                {
                  from: paymentWallet.address,
                  to: tx.to,
                  data: tx.data && tx.data.length ? tx.data : undefined,
                  value: tx.value
                },
                safeAccountConfig,
                safeVersion,
                saltNonce
              );
            } else {
              txHash = await sendTransactionAsync(tx);
            }

            if (txHash) {
              payment.fulfillmentId = session.sessionId;
              payment.fulfillmentChainId = paymentTx.chainId;
              payment.fulfillmentHash = txHash;
              updatePayment(payment);
            }
            return txHash as Hash;
          }
        });

        console.log('Glide txHash:', glideTxHash);

        if (glideTxHash && payment.referenceId) {
          payment.hash = glideTxHash;
          updatePayment(payment);
          toast.success(`Minted "${mint.metadata.name}"`, { autoClose: 2000 });

          await delay(2000);
          window.location.href = '/';
        } else {
          toast.error(`Failed to mint "${mint.metadata.name}"`, { autoClose: 2000 });
        }
      }
    } catch (error) {
      toast.error(`Failed to mint "${mint.metadata.name}"`, { autoClose: 2000 });
      console.error(`Failed to mint with error`, error);
    }
  };

  useMemo(async () => {
    if (isNativeFlow) {
      setPaymentPending(Boolean(loading || (txHash && !confirmed && !error)));
    } else {
      setPaymentPending(
        Boolean(loadingRegular || (txHashRegular && !confirmedRegular && !errorRegular))
      );
    }
  }, [
    loading,
    txHash,
    confirmed,
    error,
    loadingRegular,
    txHashRegular,
    confirmedRegular,
    errorRegular
  ]);

  const isLoading = isMintLoading || isPaymentOptionLoading || isPaymentOptionsLoading;
  const hasPaymentOption = !isLoading && paymentOption && paymentToken && mintStatus === 'live';

  return (
    <>
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
              height: 650
            })
          }
        }}
        sx={{
          zIndex: 1450,
          backdropFilter: 'blur(5px)'
        }}
        {...(isMobile && { TransitionComponent: UpSlideTransition })}>
        <BackDialogTitle
          showOnDesktop={alwaysShowBackButton}
          title={props.title ?? 'Mint Payment'}
          closeStateCallback={closeStateCallback}
        />
        <DialogContent
          sx={{
            px: 2,
            py: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
          {sender && (
            <Stack mb={2} spacing={1} alignItems="center" width="100%">
              <SenderField sender={sender} {...(setSelectedFlow && { setOpenSelectFlow })} />
              <KeyboardDoubleArrowDown />
              <FarcasterRecipientField social={social} />
            </Stack>
          )}

          <Box
            flex={1}
            overflow="auto"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="space-between">
            <Stack alignItems="center" justifyContent="start" spacing={0}>
              <Tooltip
                title={mint.metadata.description}
                arrow
                disableFocusListener
                sx={{ fontWeight: 'bold' }}
                slotProps={{
                  tooltip: { sx: { p: 1, borderRadius: 5, fontWeight: 'bold' } }
                }}>
                <Stack
                  p={1}
                  maxWidth={250}
                  direction="row"
                  alignItems="center"
                  justifyContent="center"
                  spacing={1}>
                  <Avatar
                    variant="rounded"
                    src={mint.metadata.image}
                    sx={{
                      width: 64,
                      height: 64
                    }}
                  />
                  <Stack alignItems="flex-start" spacing={0.5}>
                    <Typography fontSize={18} fontWeight="bold">
                      {mint.metadata.name}
                    </Typography>
                    <Typography
                      textAlign="start"
                      variant="subtitle2"
                      color={grey[prefersDarkMode ? 400 : 700]}>
                      {mint.collectionName}
                    </Typography>
                  </Stack>
                </Stack>
              </Tooltip>

              {isLoading ? (
                <Skeleton
                  title="fetching price"
                  variant="rectangular"
                  sx={{ borderRadius: 3, height: 45, width: 100 }}
                />
              ) : hasPaymentOption ? (
                <Typography fontSize={30} fontWeight="bold" textAlign="center">
                  {formatAmountWithSuffix(
                    normalizeNumberPrecision(parseFloat(paymentOption.paymentAmount))
                  )}{' '}
                  {paymentToken?.id.toUpperCase()}
                </Typography>
              ) : (
                <Typography textAlign="center" fontSize={14} fontWeight="bold" color={red.A400}>
                  {mintStatus === 'ended'
                    ? 'Mint has ended'
                    : mintStatus === 'error'
                    ? 'Something went wrong'
                    : "You don't have any balance to cover mint cost. Switch to a different payment flow!"}
                </Typography>
              )}
            </Stack>

            <NetworkTokenSelector
              crossChainMode
              payment={payment}
              paymentWallet={paymentWallet}
              setPaymentWallet={setPaymentWallet}
              paymentToken={paymentToken}
              setPaymentToken={setPaymentToken}
              compatibleWallets={compatibleWallets}
              enabledChainCurrencies={
                paymentOptions?.map((c) => c.paymentCurrency.toLowerCase()) ?? []
              }
              gasFee={gasFee}
            />
          </Box>

          <Box display="flex" flexDirection="column" alignItems="center" width="100%">
            <PayButton
              paymentToken={paymentToken}
              buttonText={mintStatus === 'ended' ? 'Mint Ended' : 'Mint'}
              isLoading={paymentPending}
              disabled={!hasPaymentOption}
              status={(isNativeFlow ? status : statusRegular) ?? ''}
              onClick={submitGlideTransaction}
              senderFlow={senderFlow}
            />
            <PoweredByGlideText />
          </Box>
        </DialogContent>
      </Dialog>
      {flows && selectedFlow && setSelectedFlow && (
        <ChooseFlowDialog
          configurable={false}
          open={openSelectFlow}
          onClose={() => setOpenSelectFlow(false)}
          closeStateCallback={() => setOpenSelectFlow(false)}
          flows={flows}
          selectedFlow={selectedFlow}
          setSelectedFlow={setSelectedFlow}
        />
      )}
    </>
  );
}
