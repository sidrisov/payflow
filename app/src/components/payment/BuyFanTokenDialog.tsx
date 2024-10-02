import { Stack, Box, Typography, Skeleton, DialogProps, Avatar } from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { getPaymentOption } from '../../utils/glide';
import { useChainId } from 'wagmi';
import { SelectedIdentityType } from '../../types/ProfileType';
import { FarcasterRecipientField } from '../FarcasterRecipientField';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { PaymentType } from '../../types/PaymentType';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { useContext, useMemo, useState } from 'react';
import { Token } from '../../utils/erc20contracts';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { useGlidePaymentOptions } from '../../utils/hooks/useGlidePayment';
import { ProfileContext } from '../../contexts/UserContext';
import { toast } from 'react-toastify';
import { Social } from '../../generated/graphql/types';
import { red } from '@mui/material/colors';
import { useCompatibleWallets } from '../../utils/hooks/useCompatibleWallets';
import { PayButton } from '../buttons/PayButton';
import { useFanTokenPaymentTx } from '../../utils/hooks/useFanTokenPaymentTx';
import PaymentSuccessDialog from '../dialogs/PaymentSuccessDialog';
import { getReceiptUrl } from '../../utils/receipts';
import { QuantitySelector } from './QuantitySelector';
import { BasePaymentDialog } from './BasePaymentDialog';
import { FlowSelector } from './FlowSelector';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { Address } from 'viem';
import { Chip, SvgIcon } from '@mui/material';
import FarcasterAvatar from '../avatars/FarcasterAvatar';
import { fanTokenUrl } from '../../utils/moxie';
import MoxieAvatar from '../avatars/MoxieAvatar';

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

  const { isLoading: isPaymentTxLoading, data: paymentTx } = useFanTokenPaymentTx(
    tokenAddress as Address,
    fanTokenAmount,
    payment.receiverAddress ?? profile?.identity
  );

  const {
    isLoading: isPaymentOptionsLoading,
    data: paymentOptions,
    isError: isPaymentOptionsError
  } = useGlidePaymentOptions(Boolean(paymentTx), {
    ...(paymentTx as any),
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

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const successMessage = `Successfully bought ${fanTokenAmount} ${tokenName} fan token${
    fanTokenAmount > 1 ? 's' : ''
  } for @${recipientSocial.profileName}`;
  const receiptUrl = getReceiptUrl(payment, false);

  return (
    <>
      {!showSuccessDialog && (
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
              paymentTx={paymentTx}
              paymentWallet={paymentWallet!}
              paymentOption={paymentOption!}
              payment={{ ...payment, tokenAmount: fanTokenAmount }}
              senderFlow={senderFlow}
              onSuccess={() => {
                setShowSuccessDialog(true);
              }}
              onError={(error) => {
                toast.error(`Failed to buy fan tokens!`);
                console.error('Failed to buy fan tokens with error', error);
              }}
            />
          }>
          <Stack spacing={2} height="100%">
            <Box display="flex" alignItems="center" width="100%">
              <FlowSelector
                sender={sender}
                flows={flows!}
                selectedFlow={selectedFlow!}
                setSelectedFlow={setSelectedFlow!}
              />
              <ArrowRightIcon sx={{ mx: 1 }} />
              <FarcasterRecipientField social={recipientSocial} />
            </Box>

            <Box
              flex={1}
              overflow="auto"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="space-between">
              <Stack alignItems="center" justifyContent="start" spacing={1} width="100%">
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

                <QuantitySelector
                  quantity={fanTokenAmount}
                  min={0.1}
                  max={1000}
                  decimals={1}
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
                    {isPaymentOptionsError
                      ? 'Failed to fetch payment options. Please try again.'
                      : "You don't have any balance to cover the cost. Switch to a different payment flow!"}
                  </Typography>
                )}
              </Stack>

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
          </Stack>
        </BasePaymentDialog>
      )}
      <PaymentSuccessDialog
        open={showSuccessDialog}
        onClose={() => {
          window.location.href = '/';
        }}
        message={successMessage}
        receiptUrl={receiptUrl}
      />
    </>
  );
}
