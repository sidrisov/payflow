import { DialogProps, Stack, Box, Typography, Skeleton, Avatar, Tooltip } from '@mui/material';
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
import { HypersubData } from '../../utils/hooks/useHypersubData';
import { PayButton, PaymentSuccess } from '../buttons/PayButton';
import PaymentSuccessDialog from '../dialogs/PaymentSuccessDialog';
import { getReceiptUrl } from '../../utils/receipts';
import React from 'react';
import { QuantitySelector } from './QuantitySelector';
import { BasePaymentDialog } from './BasePaymentDialog';
import { FlowSelector } from './FlowSelector';
import { Address, Hash } from 'viem';
import { useHypersubPaymentTx } from '../../utils/hooks/useHypersubPaymentTx';
import ReactMarkdown from 'react-markdown';
import { secondsToTimeUnit } from '../../utils/time';

const payflowReferrer = '0x0dEe77c83cB8b14fA95497825dF93202AbF6ad83' as Address;

export type HypersubDialogProps = DialogProps &
  CloseCallbackType & {
    sender: SelectedIdentityType;
    payment: PaymentType;
    senderSocial: Social;
    recipientSocial: Social;
    hypersub: HypersubData;
  } & {
    alwaysShowBackButton?: boolean;
    flows?: FlowType[];
    selectedFlow?: FlowType;
    setSelectedFlow?: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  };

export default function SubscribeToHypersubDialog({
  alwaysShowBackButton = false,
  sender,
  payment,
  senderSocial,
  recipientSocial,
  hypersub,
  closeStateCallback,
  flows,
  selectedFlow,
  setSelectedFlow,
  ...props
}: HypersubDialogProps) {
  const senderFlow = sender.identity.profile?.defaultFlow as FlowType;

  const isNativeFlow = senderFlow.type !== 'FARCASTER_VERIFICATION' && senderFlow.type !== 'LINKED';

  // force to display sponsored
  const [gasFee] = useState<bigint | undefined>(isNativeFlow ? BigInt(0) : undefined);

  const chainId = useChainId();

  const { profile } = useContext(ProfileContext);

  const [paymentWallet, setPaymentWallet] = useState<FlowWalletType>();
  const [paymentToken, setPaymentToken] = useState<Token>();

  const [periods, setPeriodsCount] = useState(1);
  const isGift = payment.receiverAddress !== profile?.identity;

  const {
    isLoading: isPaymentTxLoading,
    isError: isHypersubPaymentTxError,
    error: hypersubPaymentTxError,
    data: paymentTx
  } = useHypersubPaymentTx(
    hypersub,
    payment.receiverAddress ?? profile?.identity,
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
    ...(paymentTx as any),
    account: senderFlow.wallets[0].address
  });

  console.log('Payment Options: ', paymentOptions);

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

  return (
    <>
      {!paymentSuccessData && (
        <BasePaymentDialog
          alwaysShowBackButton={alwaysShowBackButton}
          title={props.title ?? 'Hypersub Payment'}
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
              payment={{ ...payment, tokenAmount: periods }}
              senderFlow={senderFlow}
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
              sx={{ fontWeight: 'bold' }}
              slotProps={{
                tooltip: {
                  sx: {
                    p: 1,
                    borderRadius: 5,
                    '& p': { margin: 0 },
                    '& a': { color: 'inherit' }
                  }
                }
              }}>
              <Stack
                p={1}
                maxWidth={200}
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={1}>
                <Avatar
                  variant="rounded"
                  src={hypersub.metadata?.image ?? ''}
                  sx={{
                    width: 64,
                    height: 64
                  }}
                />
                <Typography fontSize={18} fontWeight="bold">
                  {hypersub.state.name}
                </Typography>
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
                  (paymentOptionsError?.message ??
                    "You don't have any balance to cover subscription cost. Switch to a different payment flow!")}
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
