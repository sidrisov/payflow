import {
  Dialog,
  DialogContent,
  DialogProps,
  Stack,
  Box,
  useMediaQuery,
  useTheme,
  Typography,
  Skeleton
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { degen, optimism } from 'viem/chains';
import { glideConfig } from '../../utils/glide';
import {
  useSwitchChain,
  useChainId,
  useAccount,
  useReadContract,
  useWalletClient,
  useClient
} from 'wagmi';
import { rentStorageAbi } from '../../utils/abi/rentFcStorageAbi';
import { OP_FARCASTER_STORAGE_CONTRACT_ADDR } from '../../utils/contracts';
import { BackDialogTitle } from './BackDialogTitle';
import { SenderField } from '../SenderField';
import { KeyboardDoubleArrowDown } from '@mui/icons-material';
import { SelectedIdentityType } from '../../types/ProfleType';
import { FarcasterRecipientField } from '../FarcasterRecipientField';
import { SwitchFlowSignerSection } from './SwitchFlowSignerSection';
import { LoadingPaymentButton } from '../buttons/LoadingPaymentButton';
import { LoadingSwitchNetworkButton } from '../buttons/LoadingSwitchNetworkButton';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { PaymentType } from '../../types/PaymentType';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { useContext, useMemo, useState } from 'react';
import { Token } from '../../utils/erc20contracts';
import { Abi, Address, ContractFunctionArgs, ContractFunctionName, Hash } from 'viem';
import { normalizeNumberPrecision } from '../../utils/formats';
import { useGlideEstimatePayment, useGlidePaymentOptions } from '../../utils/hooks/useGlidePayment';
import { ProfileContext } from '../../contexts/UserContext';
import { useSafeTransfer } from '../../utils/hooks/useSafeTransfer';
import { toast } from 'react-toastify';
import { Social } from '../../generated/graphql/types';
import { SafeAccountConfig } from '@safe-global/protocol-kit';
import { SafeVersion } from '@safe-global/safe-core-sdk-types';
import { completePayment as updatePayment } from '../../services/payments';
import { grey, red } from '@mui/material/colors';
import { useRegularTransfer } from '../../utils/hooks/useRegularTransfer';
import { CAIP19, createSession, executeSession } from '@paywithglide/glide-js';
import { delay } from '../../utils/delay';
import { useNavigate } from 'react-router-dom';
import { ChooseFlowMenu } from '../menu/ChooseFlowMenu';
import ResponsiveDialog from './ResponsiveDialog';

export type GiftStorageDialog = DialogProps &
  CloseCallbackType & {
    sender: SelectedIdentityType;
    payment: PaymentType;
    social: Social;
  } & {
    flows?: FlowType[];
    selectedFlow?: FlowType;
    setSelectedFlow?: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  };

export default function GiftStorageDialog({
  sender,
  payment,
  social,
  closeStateCallback,
  flows,
  selectedFlow,
  setSelectedFlow,
  ...props
}: GiftStorageDialog) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const navigate = useNavigate();

  const [openSelectFlow, setOpenSelectFlow] = useState(false);

  const senderFlow = sender.identity.profile?.defaultFlow as FlowType;

  const isNativeFlow = senderFlow.type !== 'FARCASTER_VERIFICATION' && senderFlow.type !== 'LINKED';

  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const { isConnected, address } = useAccount();

  console.log(isConnected, address);

  const { profile } = useContext(ProfileContext);

  const [selectedWallet, setSelectedWallet] = useState<FlowWalletType>();
  const [selectedToken, setSelectedToken] = useState<Token>();

  const [paymentPending, setPaymentPending] = useState<boolean>(false);

  const [compatibleWallets, setCompatibleWallets] = useState<FlowWalletType[]>([]);

  const { data: signer } = useWalletClient();
  const client = useClient();

  const numberOfUnits = payment.tokenAmount ?? 1;

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

  const { isFetched: isUnitPriceFetched, data: rentUnitPrice } = useReadContract({
    chainId: optimism.id,
    address: OP_FARCASTER_STORAGE_CONTRACT_ADDR,
    abi: rentStorageAbi,
    functionName: 'price',
    args: [BigInt(numberOfUnits)]
  });

  const paymentTx = {
    chainId: optimism.id,
    address: OP_FARCASTER_STORAGE_CONTRACT_ADDR,
    abi: rentStorageAbi,
    functionName: 'rent',
    args: [BigInt(payment.receiverFid ?? 0), BigInt(numberOfUnits)],
    value: rentUnitPrice
  } as {
    chainId: number;
    address: Address;
    abi: Abi;
    functionName: ContractFunctionName;
    args?: ContractFunctionArgs;
    value?: bigint;
  };

  /*  const paymentTx = {
    chainId: base.id,
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    abi: erc20Abi,
    functionName: 'transfer',
    args: ['0x0dEe77c83cB8b14fA95497825dF93202AbF6ad83', parseUnits('1', 6)],
  } as {
    chainId: number;
    address: Address;
    abi: Abi;
    functionName: ContractFunctionName;
    args?: ContractFunctionArgs;
    value?: bigint;
  }; */

  const {
    isLoading: isPaymentOptionLoading,
    isFetched: isPaymentOptionFetched,
    isPending: isPaymentOptionPending,
    data: paymentOption
  } = useGlideEstimatePayment(
    isUnitPriceFetched &&
      Boolean(selectedWallet) &&
      Boolean(rentUnitPrice) &&
      Boolean(payment.receiverFid),
    {
      account: senderFlow.wallets[0].address,
      paymentCurrency: `eip155:${selectedWallet?.network}/${
        selectedToken?.tokenAddress
          ? `erc20:${selectedToken.tokenAddress}`
          : selectedWallet?.network === degen.id
          ? 'slip44:33436'
          : 'slip44:60'
      }` as CAIP19,
      ...(paymentTx as any),
      value: rentUnitPrice ?? 0n
    }
  );

  console.log(
    'Fetching status:',
    isPaymentOptionLoading,
    isPaymentOptionPending,
    isPaymentOptionFetched
  );

  const { isLoading: isPaymentOptionsLoading, data: paymentOptions } = useGlidePaymentOptions(
    isUnitPriceFetched && Boolean(rentUnitPrice) && Boolean(payment.receiverFid),
    {
      account: senderFlow.wallets[0].address,
      ...(paymentTx as any),
      value: rentUnitPrice ?? 0n
    }
  );

  console.log('Payment Options: ', paymentOptions);

  const [openConnectSignerDrawer, setOpenConnectSignerDrawer] = useState<boolean>(false);

  useMemo(async () => {
    if (!isPaymentOptionsLoading && paymentOptions) {
      setCompatibleWallets(
        senderFlow.wallets.filter((w) =>
          paymentOptions.find((o) => o.paymentCurrency.startsWith(`eip155:${w.network}`))
        )
      );
    }
  }, [isPaymentOptionsLoading, paymentOptions]);

  useMemo(async () => {
    if (compatibleWallets.length === 0) {
      setSelectedWallet(undefined);
      return;
    }
    setSelectedWallet(compatibleWallets.find((w) => w.network === chainId) ?? compatibleWallets[0]);
  }, [compatibleWallets, chainId]);

  const submitGlideTransaction = async () => {
    if (address?.toLowerCase() !== senderFlow.signer.toLowerCase()) {
      setOpenConnectSignerDrawer(true);
      return;
    }
    try {
      if (profile && client && signer && selectedWallet && paymentOption) {
        if (isNativeFlow) {
          reset();
        } else {
          resetRegular();
        }

        const session = await createSession(glideConfig, {
          account: selectedWallet.address,
          paymentCurrency: paymentOption.paymentCurrency,
          currentChainId: chainId,
          ...(paymentTx as any),
          value: rentUnitPrice
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
              const safeVersion = selectedWallet.version as SafeVersion;

              txHash = await transfer(
                client,
                signer,
                {
                  from: selectedWallet.address,
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
              payment.hash = txHash;
              updatePayment(payment);
            }
            return txHash as Hash;
          }
        });

        console.log('Glide txHash:', glideTxHash);

        if (glideTxHash && payment.referenceId) {
          payment.fulfillmentHash = glideTxHash;
          updatePayment(payment);
          toast.success(`Gifted storage to @${social.profileName}`);

          await delay(2000);
          navigate(0);
        } else {
          toast.error(`Failed to gift storage!`);
        }
      }
    } catch (error) {
      toast.error(`Failed to gift storage!`);
      console.error('Failed to gift storage with error', error);
    }
  };

  useMemo(async () => {
    if (senderFlow.type !== 'FARCASTER_VERIFICATION' && senderFlow.type !== 'LINKED') {
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
              height: 600
            })
          }
        }}
        sx={{
          backdropFilter: 'blur(5px)'
        }}>
        <BackDialogTitle title="Gift Farcaster Storage" closeStateCallback={closeStateCallback} />
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
                <SenderField sender={sender} {...(setSelectedFlow && { setOpenSelectFlow })} />
                <KeyboardDoubleArrowDown />
                <FarcasterRecipientField social={social} />

                {isPaymentOptionLoading || isPaymentOptionsLoading ? (
                  <Skeleton
                    title="fetching price"
                    variant="rectangular"
                    sx={{ borderRadius: 3, height: 45, width: 100 }}
                  />
                ) : paymentOption ? (
                  <Typography
                    fontSize={30}
                    fontWeight="bold"
                    textOverflow="ellipsis"
                    overflow="auto"
                    textAlign="center">
                    {normalizeNumberPrecision(parseFloat(paymentOption.paymentAmount))}{' '}
                    {paymentOption.currencySymbol}
                  </Typography>
                ) : (
                  <Typography fontSize={14} fontWeight="bold" color={red.A400}>
                    You don't have any balance to cover storage cost
                  </Typography>
                )}
                <Typography fontSize={18} fontWeight="bold">
                  {numberOfUnits} Unit{numberOfUnits > 1 ? 's' : ''} of Storage
                </Typography>
              </Stack>
            )}

            <Stack width="100%">
              <NetworkTokenSelector
                payment={payment}
                selectedWallet={selectedWallet}
                setSelectedWallet={setSelectedWallet}
                selectedToken={selectedToken}
                setSelectedToken={setSelectedToken}
                compatibleWallets={compatibleWallets}
                enabledChainCurrencies={paymentOptions?.map((c) => c.paymentCurrency) ?? []}
                gasFee={BigInt(0)}
              />
              {!selectedWallet || chainId === selectedWallet.network ? (
                <LoadingPaymentButton
                  title="Gift"
                  loading={paymentPending}
                  disabled={!paymentOption}
                  status={isNativeFlow ? status : statusRegular}
                  onClick={submitGlideTransaction}
                />
              ) : (
                <LoadingSwitchNetworkButton chainId={selectedWallet.network} />
              )}
              <Typography variant="caption" textAlign="center" color={grey[400]}>
                Cross-chain payments facilitated by{' '}
                <b>
                  <a href="https://paywithglide.xyz" target="_blank" style={{ color: 'inherit' }}>
                    Glide
                  </a>
                </b>
              </Typography>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
      {flows && selectedFlow && setSelectedFlow && (
        <ChooseFlowMenu
          configurable={false}
          open={openSelectFlow}
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'center'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left'
          }}
          closeStateCallback={async () => setOpenSelectFlow(false)}
          flows={flows}
          selectedFlow={selectedFlow}
          setSelectedFlow={setSelectedFlow}
        />
      )}
      {address?.toLowerCase() !== senderFlow.signer.toLowerCase() && (
        <ResponsiveDialog
          title="Connect Signer"
          open={openConnectSignerDrawer}
          onOpen={() => {
            setOpenConnectSignerDrawer(true);
          }}
          onClose={() => setOpenConnectSignerDrawer(false)}>
          <Stack alignItems="flex-start" spacing={2}>
            <Typography variant="caption" color={grey[prefersDarkMode ? 400 : 700]}>
              Selected payment flow `<b>{senderFlow.title}`</b> signer is not connected! Please,
              proceed with connecting the wallet mentioned below.
            </Typography>
            <SwitchFlowSignerSection flow={senderFlow} />
          </Stack>
        </ResponsiveDialog>
      )}
    </>
  );
}
