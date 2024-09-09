import {
  Dialog,
  DialogContent,
  DialogProps,
  Stack,
  Box,
  Typography,
  Skeleton
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { getPaymentOption } from '../../utils/glide';
import { useChainId } from 'wagmi';
import { BackDialogTitle } from './BackDialogTitle';
import { SenderField } from '../SenderField';
import { KeyboardDoubleArrowDown } from '@mui/icons-material';
import { SelectedIdentityType } from '../../types/ProfileType';
import { FarcasterRecipientField } from '../FarcasterRecipientField';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { PaymentType } from '../../types/PaymentType';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { useMemo, useState } from 'react';
import { Token } from '../../utils/erc20contracts';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { useGlidePaymentOptions } from '../../utils/hooks/useGlidePayment';
import { toast } from 'react-toastify';
import { Social } from '../../generated/graphql/types';
import { red } from '@mui/material/colors';
import { ChooseFlowDialog } from './ChooseFlowDialog';
import { UpSlideTransition } from './TransitionDownUpSlide';
import PoweredByGlideText from '../text/PoweredByGlideText';
import { useCompatibleWallets } from '../../utils/hooks/useCompatibleWallets';
import { PayButton } from '../buttons/PayButton';
import { useStoragePaymentTx } from '../../utils/hooks/useStoragePaymentTx';
import { useMobile } from '../../utils/hooks/useMobile';
import PaymentSuccessDialog from './PaymentSuccessDialog';
import { getReceiptUrl } from '../../utils/receipts';

export type BuyStorageDialogProps = DialogProps &
  CloseCallbackType & {
    sender: SelectedIdentityType;
    payment: PaymentType;
    recipientSocial: Social;
  } & {
    alwaysShowBackButton?: boolean;
    flows?: FlowType[];
    selectedFlow?: FlowType;
    setSelectedFlow?: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  };

export default function BuyStorageDialog({
  alwaysShowBackButton = false,
  sender,
  payment,
  recipientSocial,
  closeStateCallback,
  flows,
  selectedFlow,
  setSelectedFlow,
  ...props
}: BuyStorageDialogProps) {
  const isMobile = useMobile();

  const [openSelectFlow, setOpenSelectFlow] = useState(false);

  const senderFlow = sender.identity.profile?.defaultFlow as FlowType;

  const isNativeFlow = senderFlow.type !== 'FARCASTER_VERIFICATION' && senderFlow.type !== 'LINKED';

  // force to display sponsored
  const [gasFee] = useState<bigint | undefined>(isNativeFlow ? BigInt(0) : undefined);

  const chainId = useChainId();

  const [paymentWallet, setPaymentWallet] = useState<FlowWalletType>();
  const [paymentToken, setPaymentToken] = useState<Token>();

  const numberOfUnits = payment.tokenAmount ?? 1;

  const { isLoading: isPaymentTxLoading, data: paymentTx } = useStoragePaymentTx(
    numberOfUnits,
    payment.receiverFid
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

  console.log('Payment Options: ', paymentOptions);

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

  const successMessage = `Successfully bought ${numberOfUnits} unit${
    numberOfUnits > 1 ? 's' : ''
  } of storage for @${recipientSocial.profileName}`;
  const receiptUrl = getReceiptUrl(payment, false);

  return (
    <>
      {!showSuccessDialog && (
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
            title={props.title ?? 'Farcaster Storage'}
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
                <FarcasterRecipientField social={recipientSocial} />
              </Stack>
            )}

            <Box
              flex={1}
              overflow="auto"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="space-between">
              <Stack alignItems="center" justifyContent="start" spacing={1}>
                <Typography fontSize={18} fontWeight="bold">
                  {numberOfUnits} Unit{numberOfUnits > 1 ? 's' : ''} of Storage
                </Typography>

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
                      : "You don't have any balance to cover storage cost. Switch to a different payment flow!"}
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
                buttonText="Pay For Storage"
                disabled={!hasPaymentOption}
                paymentTx={paymentTx}
                paymentWallet={paymentWallet!}
                paymentOption={paymentOption!}
                payment={payment}
                senderFlow={senderFlow}
                onSuccess={() => {
                  setShowSuccessDialog(true);
                }}
                onError={(error) => {
                  toast.error(`Failed to pay for storage!`);
                  console.error('Failed to pay for storage with error', error);
                }}
              />
              <PoweredByGlideText />
            </Box>
          </DialogContent>
        </Dialog>
      )}
      <PaymentSuccessDialog
        open={showSuccessDialog}
        onClose={() => {
          window.location.href = '/';
        }}
        message={successMessage}
        receiptUrl={receiptUrl}
      />
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
