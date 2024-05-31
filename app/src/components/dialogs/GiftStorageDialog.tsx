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
import { optimism } from 'viem/chains';
import { glideClient } from '../../utils/glide';
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
import {
  Abi,
  Address,
  ContractFunctionArgs,
  ContractFunctionName,
  encodeFunctionData,
  toHex
} from 'viem';
import { normalizeNumberPrecision } from '../../utils/normalizeNumberPrecision';
import { useGlideEstimatePayment, useGlidePaymentOptions } from '../../utils/hooks/useGlidePayment';
import { ProfileContext } from '../../contexts/UserContext';
import { useSafeTransfer } from '../../utils/hooks/useSafeTransfer';
import { toast } from 'react-toastify';
import { Social } from '../../generated/graphql/types';
import { SafeAccountConfig } from '@safe-global/protocol-kit';
import { SafeVersion } from '@safe-global/safe-core-sdk-types';
import { completePayment } from '../../services/payments';
import { grey } from '@mui/material/colors';

export type GiftStorageDialog = DialogProps &
  CloseCallbackType & {
    sender: SelectedIdentityType;
    payment: PaymentType;
    social: Social;
  };

export type PaymentOption = {
  balance: string;
  balanceUSD: string;
  currencyLogoURL: string;
  currencyName: string;
  currencySymbol: string;
  paymentAmount: string;
  paymentCurrency: string;
};

export default function GiftStorageDialog({
  sender,
  payment,
  social,
  closeStateCallback,
  ...props
}: GiftStorageDialog) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const flow = sender.identity.profile?.defaultFlow as FlowType;

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

  const { loading, confirmed, error, status, txHash, transfer, reset } = useSafeTransfer();

  const { isFetched: isUnitPriceFetched, data: rentUnitPrice } = useReadContract({
    chainId: optimism.id,
    address: OP_FARCASTER_STORAGE_CONTRACT_ADDR,
    abi: rentStorageAbi,
    functionName: 'price',
    args: [1n]
  });

  const { isLoading: isPaymentOptionLoading, data: paymentOption } = useGlideEstimatePayment(
    isUnitPriceFetched && Boolean(rentUnitPrice) && Boolean(payment.receiverFid),
    `eip155:${selectedWallet?.network}/${
      selectedToken?.tokenAddress ? `erc20:${selectedToken.tokenAddress}` : `slip44:60`
    }`,
    {
      chainId: `eip155:${optimism.id}`,
      to: OP_FARCASTER_STORAGE_CONTRACT_ADDR,
      value: toHex(rentUnitPrice ?? 0),
      input: encodeFunctionData({
        abi: rentStorageAbi,
        functionName: 'rent',
        args: [BigInt(payment.receiverFid ?? 0), 1n]
      })
    }
  );

  const { isLoading: isPaymentOptionsLoading, data: paymentOptions } = useGlidePaymentOptions(
    isUnitPriceFetched && Boolean(rentUnitPrice) && Boolean(payment.receiverFid),
    flow.wallets[0].address,
    {
      chainId: `eip155:${optimism.id}`,
      to: OP_FARCASTER_STORAGE_CONTRACT_ADDR,
      value: toHex(rentUnitPrice ?? 0),
      input: encodeFunctionData({
        abi: rentStorageAbi,
        functionName: 'rent',
        args: [BigInt(payment.receiverFid ?? 0), 1n]
      })
    }
  );

  console.log('Payment Options: ', paymentOptions);

  useMemo(async () => {
    if (!isPaymentOptionsLoading && paymentOptions) {
      setCompatibleWallets(
        flow.wallets.filter((w) =>
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
    try {
      const tx = {
        chainId: optimism.id,
        /*         address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
        abi: erc20Abi,
        functionName: 'transfer',
        args: ['0x0dEe77c83cB8b14fA95497825dF93202AbF6ad83', parseUnits('0.1', 6)] */
        address: OP_FARCASTER_STORAGE_CONTRACT_ADDR,
        abi: rentStorageAbi,
        functionName: 'rent',
        args: [BigInt(payment.receiverFid ?? 0), 1n],
        value: rentUnitPrice
      } as {
        chainId: number;
        abi: Abi;
        address: Address;
        functionName: ContractFunctionName;
        args?: ContractFunctionArgs;
        value?: bigint;
      };

      if (profile && client && signer && selectedWallet && paymentOption) {
        reset();

        const glideTxHash = await glideClient.writeContract({
          account: selectedWallet.address,
          paymentCurrency: paymentOption.paymentCurrency,
          currentChainId: chainId,
          ...(tx as any),
          switchChainAsync,
          sendTransactionAsync: async (tx) => {
            console.log('Glide tnxs: ', tx);

            // TODO: hard to figure out if there 2 signers or one, for now consider if signerProvider not specified - 1, otherwise - 2
            const owners = [];
            if (
              flow.signerProvider &&
              flow.signer.toLowerCase() !== profile.identity.toLowerCase()
            ) {
              owners.push(profile.identity);
            }
            owners.push(flow.signer);

            const safeAccountConfig: SafeAccountConfig = {
              owners,
              threshold: 1
            };

            const saltNonce = flow.saltNonce as string;
            const safeVersion = selectedWallet.version as SafeVersion;

            const txHash = transfer(
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

            return txHash;
          }
        });

        console.log('Glide txHash:', glideTxHash);

        if (glideTxHash && payment.referenceId) {
          payment.hash = glideTxHash;
          completePayment(payment);
          toast.success(`Gifted storage to @${social.profileName}`);
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
    setPaymentPending(Boolean(loading || (txHash && !confirmed && !error)));
  }, [loading, txHash, confirmed, error]);

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
              <SenderField sender={sender} />
              <KeyboardDoubleArrowDown />
              <FarcasterRecipientField social={social} />

              {isPaymentOptionLoading || !paymentOption ? (
                <Skeleton
                  title="fetching price"
                  variant="rectangular"
                  sx={{ borderRadius: 3, height: 45, width: 100 }}
                />
              ) : (
                <Typography
                  fontSize={30}
                  fontWeight="bold"
                  textOverflow="ellipsis"
                  overflow="auto"
                  textAlign="center">
                  {normalizeNumberPrecision(parseFloat(paymentOption.paymentAmount))}{' '}
                  {paymentOption.currencySymbol}
                </Typography>
              )}
              <Typography fontSize={18} fontWeight="bold">
                1 Unit of Storage
              </Typography>
            </Stack>
          )}

          {address?.toLowerCase() === flow.signer.toLowerCase() ? (
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
                  status={status}
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
          ) : (
            <SwitchFlowSignerSection flow={flow} />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
