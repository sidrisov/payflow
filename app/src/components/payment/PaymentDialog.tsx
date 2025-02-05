import { Box, Stack, Typography, Skeleton, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';

import { RecipientField } from '../RecipientField';
import {
  FlowType,
  FlowWalletType,
  SelectedIdentityType,
  PaymentType,
  PaymentCategory
} from '@payflow/common';
import { useContext, useMemo, useState } from 'react';
import React from 'react';
import { BasePaymentDialog, BasePaymentDialogProps } from './BasePaymentDialog';
import { toast } from 'react-toastify';
import { Address, parseUnits, encodeFunctionData, erc20Abi, Hash } from 'viem';
import { ProfileContext } from '../../contexts/UserContext';
import { tokens as SUPPORTED_TOKENS, Token } from '@payflow/common';
import { useCompatibleWallets, useToAddress } from '../../utils/hooks/useCompatibleWallets';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { red } from '@mui/material/colors';
import { useGlidePaymentOptions } from '../../utils/hooks/useGlidePayment';
import { useTokenPrice } from '../../utils/queries/prices';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { getCommissionUSD, getPaymentOption } from '../../utils/glide';
import { TokenAmountSection } from '../dialogs/TokenAmountSection';
import { FlowSelector } from './FlowSelector';
import { PayButton, PaymentSuccess } from '../buttons/PayButton';
import PaymentSuccessDialog from '../dialogs/PaymentSuccessDialog';
import { getReceiptUrl } from '../../utils/receipts';
import { shortenWalletAddressLabel2 } from '../../utils/address';
import { CommentField } from './CommentField';

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
    flow ??
      sender.identity.profile?.defaultFlow ??
      (sender.identity.profile?.flows?.[0] as FlowType)
  );

  const { profile } = useContext(ProfileContext);

  const [paymentEnabled, setPaymentEnabled] = useState<boolean>(false);

  const [crossChainMode, setCrossChainMode] = useState<boolean>(false);

  const [paymentWallet, setPaymentWallet] = useState<FlowWalletType>();
  const [paymentToken, setPaymentToken] = useState<Token>();

  const [crossChainPaymentToken, setCrossChainPaymentToken] = useState<Token>();

  const toAddress = useToAddress({
    payment,
    recipient,
    chainId: payment?.chainId ?? paymentToken?.chainId
  });

  const [paymentAmount, setPaymentAmount] = useState<number | undefined>(payment?.tokenAmount);
  const [paymentAmountUSD, setPaymentAmountUSD] = useState<number | undefined>(payment?.usdAmount);

  const { data: tokenPrice } = useTokenPrice(paymentToken);

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
      const amount = parseUnits(
        paymentAmount.toFixed(paymentToken.decimals),
        paymentToken.decimals
      );

      regularPaymentTx = paymentToken.tokenAddress
        ? {
            chainId: paymentToken.chainId,
            from: paymentWallet.address,
            to: paymentToken.tokenAddress,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'transfer',
              args: [toAddress, amount]
            })
          }
        : {
            chainId: paymentToken.chainId,
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
        } else if (payment.usdAmount && tokenPrice) {
          const token = SUPPORTED_TOKENS.find(
            (t) => t.chainId === paymentChainId && t.id === tokenId
          );
          if (token) {
            amount = payment.usdAmount / tokenPrice;
          }
        }
      } else {
        // Case 2: new payment
        paymentChainId = paymentToken?.chainId;
        tokenId = paymentToken?.id;

        if (paymentAmount) {
          amount = paymentAmount;
        } else if (paymentAmountUSD && tokenPrice && paymentToken) {
          amount = paymentAmountUSD / tokenPrice;
        }
      }

      if (paymentChainId && tokenId && amount && toAddress) {
        const selectedToken = SUPPORTED_TOKENS.find(
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
    tokenPrice,
    toAddress,
    paymentWallet
  ]);

  const {
    isLoading: isPaymentOptionsLoading,
    data: paymentOptions,
    error: isPaymentOptionsError
  } = useGlidePaymentOptions(crossChainMode, {
    account: selectedFlow?.wallets[0].address,
    commissionUSD: !profile?.proFeatureAccess ? getCommissionUSD(payment) : 0,
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
    const amount = formatAmountWithSuffix(
      normalizeNumberPrecision(paymentAmount ?? payment?.tokenAmount ?? 0)
    );
    const tokenSymbol = paymentToken?.id.toUpperCase() ?? payment?.token;
    const recipientName =
      recipient.identity.profile?.username ??
      shortenWalletAddressLabel2(recipient.identity.address);

    return `paid ${amount} ${tokenSymbol} to @${recipientName}`;
  }, [paymentAmount, paymentToken, payment, recipient]);

  const getSubtitle = (category?: PaymentCategory) => {
    switch (category) {
      case 'reward':
        return 'Reward';
      case 'reward_top_reply':
        return 'Top Reply Reward';
      case 'reward_top_casters':
        return 'Top Caster Reward';
      default:
        return undefined;
    }
  };

  const [comment, setComment] = useState(payment?.comment ?? '');

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
      completedAt={new Date(payment?.completedAt ?? Date.now())}
    />
  ) : (
    <BasePaymentDialog
      mode={crossChainMode ? 'cross-chain' : 'normal'}
      alwaysShowBackButton={alwaysShowBackButton}
      title={props.title ?? 'New Payment'}
      subtitle={payment?.name ?? getSubtitle(payment?.category)}
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
          payment={{
            ...(payment ??
              ({
                type: 'APP',
                status: 'CREATED',
                receiver: recipient.identity.profile,
                receiverAddress: toAddress,
                chainId: paymentToken?.chainId,
                token: paymentToken?.id,
                tokenAmount: paymentAmount
              } as PaymentType)),
            comment
          }}
          senderFlow={selectedFlow}
          onSuccess={setPaymentSuccessData}
          onError={(error: any) => {
            toast.error(`Failed to pay:\n"${error.message}"`, {
              autoClose: false,
              closeButton: true
            });
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
        <Box ml={1} width="100%" display="flex" alignItems="start" justifyContent="space-between">
          <RecipientField
            recipient={recipient}
            recipientAddress={toAddress}
            setOpenSearchIdentity={setOpenSearchIdentity}
          />

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Cross-chain mode:
            </Typography>
            <ToggleButtonGroup
              sx={{
                borderRadius: 3,
                '& .MuiToggleButton-root': {
                  '&:first-of-type': {
                    borderTopLeftRadius: '10px',
                    borderBottomLeftRadius: '10px'
                  },
                  '&:last-of-type': {
                    borderTopRightRadius: '10px',
                    borderBottomRightRadius: '10px'
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
                <Typography variant="caption" fontWeight="bold" textTransform="none">
                  regular
                </Typography>
              </ToggleButton>
              <ToggleButton
                disabled={!paymentAmount || paymentAmount === 0}
                size="small"
                value="cross-chain">
                <Typography variant="caption" fontWeight="bold" textTransform="none">
                  pay with other token
                </Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Stack
          width="100%"
          flex={1}
          alignItems="flex-start"
          justifyContent="center"
          overflow="auto"
          mt={2}
          px={2}>
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
                {isPaymentOptionsError
                  ? 'Failed to fetch payment options. Please try again.'
                  : 'Balance not enough. Switch payment wallet!'}
              </Typography>
            ))}

          {crossChainMode && !profile?.proFeatureAccess && (
            <Typography fontSize={12} color="text.secondary">
              fee:{' $'}
              {getCommissionUSD(payment)}
            </Typography>
          )}

          <Box ml={!crossChainMode ? 0.5 : 0}>
            <CommentField comment={comment} setComment={setComment} />
          </Box>
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
            paymentToken={crossChainMode ? crossChainPaymentToken : paymentToken}
            setPaymentToken={crossChainMode ? setCrossChainPaymentToken : setPaymentToken}
            compatibleWallets={compatibleWallets}
            supportedTokens={recipient.identity.profile?.defaultFlow?.supportedTokens}
            enabledChainCurrencies={
              crossChainMode
                ? (paymentOptions?.map((c) => c.paymentCurrency.toLowerCase()) ?? [])
                : undefined
            }
          />
        </Box>
      </Box>
    </BasePaymentDialog>
  );
}
