import { Box, Stack, Typography, Skeleton, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { SelectedIdentityType } from '../../types/ProfileType';
import { PaymentType } from '../../types/PaymentType';
import { RecipientField } from '../RecipientField';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { useContext, useMemo, useState } from 'react';
import React from 'react';
import { BasePaymentDialog, BasePaymentDialogProps } from './BasePaymentDialog';
import { toast } from 'react-toastify';
import { Address, parseUnits, encodeFunctionData, erc20Abi, Hash } from 'viem';
import { ProfileContext } from '../../contexts/UserContext';
import { ERC20_CONTRACTS, Token } from '../../utils/erc20contracts';
import { useCompatibleWallets, useToAddress } from '../../utils/hooks/useCompatibleWallets';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { red } from '@mui/material/colors';
import { useGlidePaymentOptions } from '../../utils/hooks/useGlidePayment';
import { useTokenPrices } from '../../utils/queries/prices';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { getPaymentOption } from '../../utils/glide';
import { TokenAmountSection } from '../dialogs/TokenAmountSection';
import { FlowSelector } from './FlowSelector';
import { PayButton, PaymentSuccess } from '../buttons/PayButton';
import PaymentSuccessDialog from '../dialogs/PaymentSuccessDialog';
import { getReceiptUrl } from '../../utils/receipts';
import { shortenWalletAddressLabel2 } from '../../utils/address';

export type PaymentSenderType = 'payflow' | 'wallet' | 'none';

export type PaymentDialogProps = Omit<BasePaymentDialogProps, 'children'> &
  CloseCallbackType & {
    paymentType?: PaymentSenderType;
    payment?: PaymentType;
    sender: SelectedIdentityType;
    recipient: SelectedIdentityType;
    setOpenSearchIdentity?: React.Dispatch<React.SetStateAction<boolean>>;
    flow?: FlowType;
  };

export default function PaymentDialog({
  alwaysShowBackButton = false,
  paymentType = 'payflow',
  payment,
  recipient,
  sender,
  closeStateCallback,
  setOpenSearchIdentity,
  flow,

  ...props
}: PaymentDialogProps) {
  const senderAddress = sender.identity.address as Address;
  const [selectedFlow, setSelectedFlow] = useState<FlowType>(
    flow ?? (sender.identity.profile?.defaultFlow as FlowType)
  );

  console.log('selectedFlow', selectedFlow);

  const { profile } = useContext(ProfileContext);

  const [paymentEnabled, setPaymentEnabled] = useState<boolean>(false);

  const [crossChainMode, setCrossChainMode] = useState<boolean>(false);

  const [paymentWallet, setPaymentWallet] = useState<FlowWalletType>();
  const [paymentToken, setPaymentToken] = useState<Token>();

  const [crossChainPaymentToken, setCrossChainPaymentToken] = useState<Token>();

  const toAddress = useToAddress({
    recipient,
    chainId: payment?.chainId ?? paymentToken?.chainId
  });

  const [paymentAmount, setPaymentAmount] = useState<number | undefined>(payment?.tokenAmount);
  const [paymentAmountUSD, setPaymentAmountUSD] = useState<number | undefined>(payment?.usdAmount);

  const isNativeFlow =
    paymentType === 'payflow' &&
    selectedFlow.type !== 'FARCASTER_VERIFICATION' &&
    selectedFlow.type !== 'LINKED';

  const { data: tokenPrices } = useTokenPrices();

  const recipientCompatibleFlows = profile?.flows?.filter(
    (flow) =>
      recipient.type === 'address' ||
      flow.wallets.find((senderWallet) =>
        recipient.identity.profile?.defaultFlow?.wallets.find(
          (recipientWallet) => recipientWallet.network === senderWallet.network
        )
      )
  );

  const { regularPaymentTx, glidePaymentTx } = useMemo(() => {
    let regularPaymentTx = null;
    let glidePaymentTx = null;

    // Prepare regular payment transaction
    if (paymentWallet && paymentToken && toAddress && paymentAmount) {
      const amount = parseUnits(paymentAmount.toString(), paymentToken.decimals);

      regularPaymentTx = paymentToken.tokenAddress
        ? {
            from: paymentWallet.address,
            to: paymentToken.tokenAddress,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'transfer',
              args: [toAddress, amount]
            })
          }
        : {
            from: paymentWallet.address,
            to: toAddress,
            value: amount
          };
    }

    // Prepare Glide payment transaction
    if (crossChainMode) {
      let paymentChainId: number | undefined;
      let tokenId: string | undefined;
      let amount: number | undefined;

      if (payment) {
        // Case 1: submitted payment
        paymentChainId = payment.chainId;
        tokenId = payment.token;

        if (payment.tokenAmount) {
          amount = payment.tokenAmount;
        } else if (payment.usdAmount && tokenPrices) {
          const token = ERC20_CONTRACTS.find(
            (t) => t.chainId === paymentChainId && t.id === tokenId
          );
          if (token) {
            amount = payment.usdAmount / tokenPrices[token.id];
          }
        }
      } else {
        // Case 2: new payment
        paymentChainId = paymentToken?.chainId;
        tokenId = paymentToken?.id;

        if (paymentAmount) {
          amount = paymentAmount;
        } else if (paymentAmountUSD && tokenPrices && paymentToken) {
          amount = paymentAmountUSD / tokenPrices[paymentToken.id];
        }
      }

      if (paymentChainId && tokenId && amount && toAddress) {
        const selectedToken = ERC20_CONTRACTS.find(
          (t) => t.chainId === paymentChainId && t.id === tokenId
        );

        if (selectedToken) {
          const value = parseUnits(amount.toString(), selectedToken.decimals);

          glidePaymentTx = selectedToken.tokenAddress
            ? {
                chainId: paymentChainId,
                address: selectedToken.tokenAddress,
                abi: erc20Abi,
                functionName: 'transfer',
                args: [toAddress, value]
              }
            : {
                chainId: paymentChainId,
                address: toAddress,
                value
              };
        }
      }
    }

    return { regularPaymentTx, glidePaymentTx };
  }, [
    crossChainMode,
    payment,
    paymentToken,
    paymentAmount,
    paymentAmountUSD,
    tokenPrices,
    toAddress,
    paymentWallet
  ]);

  const {
    isLoading: isPaymentOptionsLoading,
    data: paymentOptions,
    error: isPaymentOptionsError
  } = useGlidePaymentOptions(crossChainMode, {
    account: selectedFlow?.wallets[0].address,
    ...(glidePaymentTx as any)
  });

  const compatibleWallets = useCompatibleWallets({
    sender: paymentType === 'payflow' ? selectedFlow : senderAddress,
    recipient,
    payment,
    paymentOptions: crossChainMode && !isPaymentOptionsLoading ? paymentOptions : undefined
  });

  const paymentOption = useMemo(
    () => getPaymentOption(paymentOptions, crossChainPaymentToken),
    [paymentOptions, crossChainPaymentToken]
  );

  const isLoading = isPaymentOptionsLoading;
  const hasPaymentOption = !isLoading && paymentOption && crossChainPaymentToken;

  const [gasFee] = useState<bigint | undefined>(isNativeFlow ? BigInt(0) : undefined);

  useMemo(async () => {
    setPaymentWallet(compatibleWallets?.[0]);
  }, [compatibleWallets]);

  useMemo(async () => {
    console.log('Checking payment enabled: ', toAddress, paymentAmount, paymentAmountUSD);
    if (!toAddress) {
      setPaymentEnabled(false);
    }
  }, [toAddress]);

  const [paymentSuccessData, setPaymentSuccessData] = useState<PaymentSuccess | null>(
    payment?.status === 'COMPLETED' ? { txHash: payment.hash as Hash } : null
  );
  const successMessage = useMemo(() => {
    const amount = paymentAmount ?? payment?.tokenAmount;
    const tokenSymbol = paymentToken?.id.toUpperCase() ?? payment?.token;
    const recipientName =
      recipient.identity.profile?.username ??
      shortenWalletAddressLabel2(recipient.identity.address);

    return `Successfully sent ${amount} ${tokenSymbol} to ${recipientName}`;
  }, [paymentAmount, paymentToken, payment, recipient]);

  return paymentSuccessData ? (
    <PaymentSuccessDialog
      message={successMessage}
      receiptUrl={getReceiptUrl(
        {
          ...(payment ??
            ({
              receiver: recipient.identity.profile,
              receiverAddress: toAddress,
              chainId: paymentToken?.chainId,
              token: paymentToken?.id,
              tokenAmount: paymentAmount
            } as PaymentType)),
          hash: paymentSuccessData.txHash
        },
        false
      )}
    />
  ) : (
    <BasePaymentDialog
      mode={crossChainMode ? 'cross-chain' : 'normal'}
      alwaysShowBackButton={alwaysShowBackButton}
      title={props.title ?? 'New Payment'}
      expiresAt={payment?.expiresAt}
      closeStateCallback={closeStateCallback}
      footerContent={
        <PayButton
          crossChainMode={crossChainMode}
          paymentToken={crossChainMode ? crossChainPaymentToken : paymentToken}
          buttonText="Pay"
          disabled={crossChainMode ? !hasPaymentOption : !paymentEnabled}
          paymentTx={crossChainMode ? glidePaymentTx : regularPaymentTx}
          paymentWallet={paymentWallet!}
          paymentOption={paymentOption!}
          payment={
            payment ??
            ({
              type: 'APP',
              status: 'CREATED',
              receiver: recipient.identity.profile,
              receiverAddress: toAddress,
              chainId: paymentToken?.chainId,
              token: paymentToken?.id,
              tokenAmount: paymentAmount
            } as PaymentType)
          }
          senderFlow={selectedFlow}
          onSuccess={setPaymentSuccessData}
          onError={(error: any) => {
            toast.error(`Failed to pay!`);
            console.error('Failed to pay with error', error);
          }}
          {...props}
        />
      }
      {...props}>
      <Box
        height="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="space-between">
        <Box ml={1} width="100%" display="flex" alignItems="center" justifyContent="space-between">
          <RecipientField recipient={recipient} setOpenSearchIdentity={setOpenSearchIdentity} />

          <ToggleButtonGroup
            sx={{
              borderRadius: 3,
              '& .MuiToggleButton-root': {
                '&:first-of-type': {
                  borderTopLeftRadius: 15,
                  borderBottomLeftRadius: 15
                },
                '&:last-of-type': {
                  borderTopRightRadius: 15,
                  borderBottomRightRadius: 15
                }
              }
            }}
            value={crossChainMode ? 'cross-chain' : 'direct'}
            exclusive
            onChange={(_, newMode) => {
              if (newMode !== null) {
                setCrossChainMode(newMode === 'cross-chain');
              }
            }}
            size="small">
            <ToggleButton size="small" value="direct">
              <Typography variant="caption" fontWeight="bold" textTransform="lowercase">
                Direct
              </Typography>
            </ToggleButton>
            <ToggleButton size="small" value="cross-chain">
              <Typography variant="caption" fontWeight="bold" textTransform="lowercase">
                Cross-chain
              </Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Stack flex={1} alignItems="center" justifyContent="center" overflow="auto">
          <TokenAmountSection
            payment={payment}
            crossChainMode={crossChainMode}
            setCrossChainMode={setCrossChainMode}
            setPaymentEnabled={setPaymentEnabled}
            selectedWallet={paymentWallet}
            selectedToken={paymentToken}
            paymentAmount={paymentAmount}
            setPaymentAmount={setPaymentAmount}
            paymentAmountUSD={paymentAmountUSD}
            setPaymentAmountUSD={setPaymentAmountUSD}
          />

          {crossChainMode &&
            (isLoading ? (
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
                {paymentOption.currencySymbol.toUpperCase()}
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
            ))}
        </Stack>

        <Box width="100%" display="flex" flexDirection="row" justifyContent="space-between">
          <FlowSelector
            disabled={!recipientCompatibleFlows}
            variant="outlined"
            flows={recipientCompatibleFlows!}
            selectedFlow={selectedFlow}
            setSelectedFlow={setSelectedFlow}
          />
          <NetworkTokenSelector
            payment={payment}
            crossChainMode={crossChainMode}
            paymentWallet={paymentWallet}
            setPaymentWallet={setPaymentWallet}
            paymentToken={crossChainMode ? crossChainPaymentToken : paymentToken}
            setPaymentToken={crossChainMode ? setCrossChainPaymentToken : setPaymentToken}
            compatibleWallets={compatibleWallets}
            enabledChainCurrencies={
              crossChainMode
                ? paymentOptions?.map((c) => c.paymentCurrency.toLowerCase()) ?? []
                : undefined
            }
            gasFee={gasFee}
          />
        </Box>
      </Box>
    </BasePaymentDialog>
  );
}
