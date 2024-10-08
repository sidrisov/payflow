import { Stack, Box, Typography, Skeleton, DialogProps, IconButton } from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { getPaymentOption } from '../../utils/glide';
import { useChainId } from 'wagmi';
import { SelectedIdentityType } from '../../types/ProfileType';
import { FarcasterRecipientField } from '../FarcasterRecipientField';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { PaymentType } from '../../types/PaymentType';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { useContext, useMemo, useState } from 'react';
import { ERC20_CONTRACTS, Token } from '../../utils/erc20contracts';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { useGlidePaymentOptions } from '../../utils/hooks/useGlidePayment';
import { ProfileContext } from '../../contexts/UserContext';
import { toast } from 'react-toastify';
import { Social } from '../../generated/graphql/types';
import { red } from '@mui/material/colors';
import { useCompatibleWallets } from '../../utils/hooks/useCompatibleWallets';
import { PayButton, PaymentSuccess } from '../buttons/PayButton';
import { useFanTokenPaymentTx } from '../../utils/hooks/useFanTokenPaymentTx';
import PaymentSuccessDialog from '../dialogs/PaymentSuccessDialog';
import { getReceiptUrl } from '../../utils/receipts';
import { QuantitySelector } from './QuantitySelector';
import { BasePaymentDialog } from './BasePaymentDialog';
import { FlowSelector } from './FlowSelector';
import { Address, Hash } from 'viem';
import { Chip } from '@mui/material';
import { fanTokenUrl } from '../../utils/moxie';
import MoxieAvatar from '../avatars/MoxieAvatar';

import { IoMdLock, IoMdUnlock } from 'react-icons/io';

export type BuyFanTokenDialogProps = DialogProps &
  CloseCallbackType & {
    sender: SelectedIdentityType;
    payment: PaymentType;
    senderSocial: Social;
    recipientSocial: Social;
    alwaysShowBackButton?: boolean;
    flows?: FlowType[];
    selectedFlow?: FlowType;
    setSelectedFlow?: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  };

const MOXIE_CONTRACT_ADDRESS = ERC20_CONTRACTS.find((t) => t.id === 'moxie')?.tokenAddress;

export default function BuyFanTokenDialog({
  alwaysShowBackButton = false,
  sender,
  payment,
  senderSocial,
  recipientSocial,
  closeStateCallback,
  flows,
  selectedFlow,
  setSelectedFlow,
  ...props
}: BuyFanTokenDialogProps) {
  const senderFlow = sender.identity.profile?.defaultFlow as FlowType;
  const isNativeFlow = senderFlow.type !== 'FARCASTER_VERIFICATION' && senderFlow.type !== 'LINKED';

  const [gasFee] = useState<bigint | undefined>(isNativeFlow ? BigInt(0) : undefined);

  const chainId = useChainId();

  const { profile } = useContext(ProfileContext);

  const [paymentWallet, setPaymentWallet] = useState<FlowWalletType>();
  const [paymentToken, setPaymentToken] = useState<Token>();

  const [fanTokenAmount, setFanTokenAmount] = useState(payment.tokenAmount ?? 1);

  const [tokenName, tokenAddress] = payment.token.split(';');

  const [locked, setLocked] = useState(false);

  const { isLoading: isPaymentTxLoading, data: paymentTx } = useFanTokenPaymentTx(
    tokenAddress as Address,
    fanTokenAmount,
    payment.receiverAddress ?? profile?.identity,
    locked
  );

  const {
    isLoading: isPaymentOptionsLoading,
    data: paymentOptions,
    isError: isPaymentOptionsError
  } = useGlidePaymentOptions(Boolean(paymentTx), {
    ...(paymentTx as any),
    approval: {
      token: MOXIE_CONTRACT_ADDRESS,
      amount: paymentTx?.args?.[1] ?? 0n
    },
    account: senderFlow.wallets[0].address
  });

  const paymentOption = useMemo(
    () => getPaymentOption(paymentOptions, paymentToken),
    [paymentOptions, paymentToken]
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

  const isLoading = isPaymentTxLoading || isPaymentOptionsLoading;
  const hasPaymentOption = !isLoading && paymentOption && paymentToken;

  const [paymentSuccessData, setPaymentSuccessData] = useState<PaymentSuccess | null>(
    payment.status === 'COMPLETED' ? { txHash: payment.hash as Hash } : null
  );
  const successMessage = `Successfully bought ${fanTokenAmount} ${tokenName} fan token${
    fanTokenAmount > 1 ? 's' : ''
  } for @${recipientSocial.profileName}`;

  return (
    <>
      {!paymentSuccessData && (
        <BasePaymentDialog
          alwaysShowBackButton={alwaysShowBackButton}
          title={props.title ?? 'Buy Fan Tokens'}
          closeStateCallback={closeStateCallback}
          {...props}
          footerContent={
            <PayButton
              paymentToken={paymentToken}
              buttonText="Buy Fan Tokens"
              disabled={!hasPaymentOption}
              paymentTx={{
                ...paymentTx,
                approval: { token: MOXIE_CONTRACT_ADDRESS, amount: paymentTx?.args?.[1] }
              }}
              paymentWallet={paymentWallet!}
              paymentOption={paymentOption!}
              payment={{ ...payment, tokenAmount: fanTokenAmount }}
              senderFlow={senderFlow}
              onSuccess={setPaymentSuccessData}
              onError={(error) => {
                toast.error(`Failed to buy fan tokens!`);
                console.error('Failed to buy fan tokens with error', error);
              }}
            />
          }>
          <Box ml={1}>
            <FarcasterRecipientField variant="text" social={recipientSocial} />
          </Box>
          <Stack flex={1} alignItems="center" justifyContent="center" spacing={1} overflow="auto">
            <Stack alignItems="center" spacing={0.3}>
              <Chip
                icon={<MoxieAvatar size={18} />}
                label={tokenName}
                clickable={true}
                onClick={() => {
                  window.open(fanTokenUrl(tokenName), '_blank');
                }}
                sx={{
                  px: 0.5,
                  fontSize: 18,
                  fontWeight: 'bold'
                }}
              />
              <Box display="flex" alignItems="center">
                <IconButton
                  size="small"
                  onClick={() => setLocked(!locked)}
                  sx={{ mr: 0.5, color: 'text.secondary' }}>
                  {locked ? <IoMdLock size={15} /> : <IoMdUnlock size={15} />}
                </IconButton>
                <Typography variant="caption" fontWeight="bold" color="text.secondary">
                  {locked ? '3 months lock period' : 'No lock period'}
                </Typography>
              </Box>
            </Stack>

            <QuantitySelector
              quantity={fanTokenAmount}
              min={0.1}
              max={1000}
              decimals={1}
              step={10}
              setQuantity={setFanTokenAmount}
            />

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
                {isPaymentOptionsError ? (
                  'Failed to fetch payment options. Please try again.'
                ) : (
                  <>
                    Balance not enough to cover the payment.
                    <br />
                    Switch to a different payment flow!
                  </>
                )}
              </Typography>
            )}
          </Stack>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Box width="50%">
              <FlowSelector
                variant="text"
                sender={sender}
                flows={flows!}
                selectedFlow={selectedFlow!}
                setSelectedFlow={setSelectedFlow!}
              />
            </Box>
            <Box width="50%">
              <NetworkTokenSelector
                crossChainMode
                payment={{ ...payment, tokenAmount: fanTokenAmount }}
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
          </Box>
        </BasePaymentDialog>
      )}
      {paymentSuccessData && (
        <PaymentSuccessDialog
          open={true}
          onClose={() => {
            window.location.href = '/';
          }}
          message={successMessage}
          receiptUrl={getReceiptUrl({ ...payment, hash: paymentSuccessData.txHash }, false)}
        />
      )}
    </>
  );
}
