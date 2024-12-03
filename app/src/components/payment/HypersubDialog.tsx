import {
  DialogProps,
  Stack,
  Box,
  Typography,
  Skeleton,
  Avatar,
  Tooltip,
  IconButton
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { getCommissionUSD, getPaymentOption } from '../../utils/glide';
import { useChainId } from 'wagmi';
import { SelectedIdentityType } from '../../types/ProfileType';
import { FarcasterRecipientField } from '../FarcasterRecipientField';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { PaymentType } from '../../types/PaymentType';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { useMemo, useState } from 'react';
import { Token } from '@payflow/common';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { useGlidePaymentOptions } from '../../utils/hooks/useGlidePayment';
import { toast } from 'react-toastify';
import { Social } from '../../generated/graphql/types';
import { red } from '@mui/material/colors';
import { useCompatibleWallets } from '../../utils/hooks/useCompatibleWallets';
import { HypersubData } from '../../utils/hooks/useHypersub';
import { PayButton, PaymentSuccess } from '../buttons/PayButton';
import PaymentSuccessDialog from '../dialogs/PaymentSuccessDialog';
import { getReceiptUrl } from '../../utils/receipts';
import { QuantitySelector } from './QuantitySelector';
import { BasePaymentDialog } from './BasePaymentDialog';
import { FlowSelector } from './FlowSelector';
import { Address, Hash } from 'viem';
import { useHypersubPaymentTx } from '../../utils/hooks/useHypersubPaymentTx';
import ReactMarkdown from 'react-markdown';
import { secondsToTimeUnit } from '../../utils/time';
import { InfoOutlined } from '@mui/icons-material';
import { useMobile } from '../../utils/hooks/useMobile';
import { CommentField } from './CommentField';

const payflowReferrer = '0x0dEe77c83cB8b14fA95497825dF93202AbF6ad83' as Address;

export type HypersubDialogProps = DialogProps &
  CloseCallbackType & {
    sender: SelectedIdentityType;
    payment: PaymentType;
    senderSocial: Social;
    recipientSocial: Social;
    hypersub: HypersubData;
    alwaysShowBackButton?: boolean;
  };

export default function HypersubDialog({
  alwaysShowBackButton = false,
  sender,
  payment,
  senderSocial,
  recipientSocial,
  hypersub,
  closeStateCallback,
  ...props
}: HypersubDialogProps) {
  const [selectedFlow, setSelectedFlow] = useState<FlowType>(
    sender.identity.profile?.defaultFlow ?? (sender.identity.profile?.flows?.[0] as FlowType)
  );

  const isNativeFlow =
    selectedFlow.type !== 'FARCASTER_VERIFICATION' && selectedFlow.type !== 'LINKED';

  const isMobile = useMobile();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const [gasFee] = useState<bigint | undefined>(isNativeFlow ? BigInt(0) : undefined);

  const chainId = useChainId();

  const [paymentWallet, setPaymentWallet] = useState<FlowWalletType>();
  const [paymentToken, setPaymentToken] = useState<Token>();

  const [periods, setPeriodsCount] = useState(1);
  const isGift = payment.receiverAddress !== sender.identity.address;

  const [comment, setComment] = useState('');

  const handleTooltipToggle = () => {
    if (isMobile) {
      setIsTooltipOpen(!isTooltipOpen);
    }
  };

  const {
    isLoading: isPaymentTxLoading,
    isError: isHypersubPaymentTxError,
    error: hypersubPaymentTxError,
    data: paymentTx
  } = useHypersubPaymentTx(
    hypersub,
    payment.receiverAddress ?? sender.identity.address,
    payflowReferrer,
    periods
  );

  console.log('Hypersub tx: ', paymentTx);

  const {
    isLoading: isPaymentOptionsLoading,
    data: paymentOptions,
    isError: isPaymentOptionsError,
    error: paymentOptionsError
  } = useGlidePaymentOptions(Boolean(paymentTx), {
    commissionUSD: getCommissionUSD(payment.category),
    ...(paymentTx as any),
    account: selectedFlow.wallets[0].address
  });

  console.log('Payment Options: ', paymentOptions);

  const paymentOption = useMemo(
    () => getPaymentOption(paymentOptions, paymentToken),
    [paymentOptions, paymentToken]
  );

  const compatibleWallets = useCompatibleWallets({
    sender: selectedFlow,
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
  const hasPaymentOption = !isLoading && paymentOption && paymentToken && !isHypersubPaymentTxError;

  const [paymentSuccessData, setPaymentSuccessData] = useState<PaymentSuccess | null>(
    payment.status === 'COMPLETED' ? { txHash: payment.hash as Hash } : null
  );

  const successMessage = `bought ${periods} month(s) of "${hypersub.state.name}" subscription ${
    isGift ? `for @${recipientSocial.profileName}` : ''
  }`;

  const { timeUnit, unitValue } = secondsToTimeUnit(
    hypersub.state.tier1.params.periodDurationSeconds
  );

  return paymentSuccessData ? (
    <PaymentSuccessDialog
      message={successMessage}
      receiptUrl={getReceiptUrl({ ...payment, hash: paymentSuccessData.txHash }, false)}
    />
  ) : (
    <BasePaymentDialog
      alwaysShowBackButton={alwaysShowBackButton}
      title={props.title ?? 'Hypersub Payment'}
      subtitle="Hypersub Subscription"
      expiresAt={payment?.expiresAt}
      closeStateCallback={closeStateCallback}
      {...props}
      footerContent={
        <PayButton
          paymentToken={paymentToken}
          buttonText="Subscribe"
          disabled={!hasPaymentOption}
          paymentTx={paymentTx}
          paymentWallet={paymentWallet!}
          paymentOption={paymentOption!}
          payment={{
            ...payment,
            tokenAmount: periods,
            comment
          }}
          senderFlow={selectedFlow}
          onSuccess={setPaymentSuccessData}
          onError={(error) => {
            toast.error(`Failed to subscribe to "${hypersub.metadata?.name}"`, {
              autoClose: 2000
            });
            console.error(`Failed to subscribe with error`, error);
          }}
        />
      }>
      <Box ml={1}>
        <FarcasterRecipientField variant="text" social={recipientSocial} />
      </Box>
      <Stack flex={1} alignItems="center" justifyContent="center" spacing={1} overflow="auto">
        <Tooltip
          title={<ReactMarkdown>{hypersub.metadata?.description ?? ''}</ReactMarkdown>}
          arrow
          disableFocusListener
          disableTouchListener={!isMobile}
          open={isMobile ? isTooltipOpen : undefined}
          onClose={() => isMobile && setIsTooltipOpen(false)}
          slotProps={{
            tooltip: {
              sx: {
                p: 0.5,
                maxWidth: 300,
                fontWeight: 'bold',
                textWrap: 'pretty',
                borderRadius: 5,
                '& p': { margin: 0 },
                '& a': { color: 'inherit' }
              }
            }
          }}>
          <Stack p={1} maxWidth={250} direction="row" alignItems="center" justifyContent="center">
            <Avatar
              variant="rounded"
              src={hypersub.metadata?.image ?? ''}
              sx={{
                width: 64,
                height: 64
              }}
            />
            <Typography
              fontSize={18}
              fontWeight="bold"
              sx={{ textWrap: 'stable', textAlign: 'center' }}>
              {hypersub.state.name}
            </Typography>
            <IconButton
              size="small"
              sx={{
                ml: 0.5,
                '&:hover': {
                  backgroundColor: 'transparent'
                }
              }}
              onClick={handleTooltipToggle}>
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Stack>
        </Tooltip>

        <QuantitySelector
          quantity={periods}
          min={unitValue}
          max={36}
          setQuantity={setPeriodsCount}
          unitText={timeUnit}
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
          <Typography
            textAlign="center"
            fontSize={14}
            fontWeight="bold"
            color={red.A400}
            sx={{
              textWrap: 'balance'
            }}>
            {isHypersubPaymentTxError &&
              (hypersubPaymentTxError?.message ?? 'Failed to load payment transaction')}
            {(paymentOptions?.length === 0 || isPaymentOptionsError) &&
              (paymentOptionsError?.message ?? 'Balance not enough. Switch payment flow!')}
          </Typography>
        )}

        <CommentField comment={comment} setComment={setComment} />
      </Stack>
      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
        <FlowSelector
          variant="outlined"
          flows={sender.identity.profile?.flows ?? []}
          selectedFlow={selectedFlow}
          setSelectedFlow={setSelectedFlow}
        />
        <NetworkTokenSelector
          crossChainMode
          payment={payment}
          paymentToken={paymentToken}
          setPaymentToken={setPaymentToken}
          compatibleWallets={compatibleWallets}
          enabledChainCurrencies={paymentOptions?.map((c) => c.paymentCurrency.toLowerCase()) ?? []}
        />
      </Box>
    </BasePaymentDialog>
  );
}
