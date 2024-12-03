import {
  Stack,
  Box,
  Typography,
  Skeleton,
  DialogProps,
  IconButton,
  Button,
  TextField,
  Tooltip
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { getCommissionUSD, getPaymentOption } from '../../utils/glide';
import { useChainId } from 'wagmi';
import { SelectedIdentityType } from '../../types/ProfileType';
import { FarcasterRecipientField } from '../FarcasterRecipientField';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { PaymentType } from '../../types/PaymentType';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { useContext, useMemo, useState } from 'react';
import { tokens as SUPPORTED_TOKENS, Token } from '@payflow/common';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { useGlidePaymentOptions } from '../../utils/hooks/useGlidePayment';
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
import { SiFarcaster } from 'react-icons/si';
import { TbCopy } from 'react-icons/tb';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { createShareUrls } from '../../utils/moxie';
import { createCastPostMessage, createComposeCastUrl } from '../../utils/warpcast';
import { InfoOutlined } from '@mui/icons-material';
import { useMobile } from '../../utils/hooks/useMobile';
import { ProfileContext } from '../../contexts/UserContext';
import { CommentField } from './CommentField';

export type BuyFanTokenDialogProps = DialogProps &
  CloseCallbackType & {
    sender: SelectedIdentityType;
    payment: PaymentType;
    senderSocial: Social;
    recipientSocial: Social;
    alwaysShowBackButton?: boolean;
  };

const MOXIE_CONTRACT_ADDRESS = SUPPORTED_TOKENS.find((t) => t.id === 'moxie')?.tokenAddress;

export default function BuyFanTokenDialog({
  alwaysShowBackButton = false,
  sender,
  payment,
  senderSocial,
  recipientSocial,
  closeStateCallback,
  ...props
}: BuyFanTokenDialogProps) {
  const { isMiniApp } = useContext(ProfileContext);

  const [selectedFlow, setSelectedFlow] = useState<FlowType>(
    sender.identity.profile?.defaultFlow ?? (sender.identity.profile?.flows?.[0] as FlowType)
  );

  const chainId = useChainId();

  const [paymentWallet, setPaymentWallet] = useState<FlowWalletType>();
  const [paymentToken, setPaymentToken] = useState<Token>();

  const [fanTokenAmount, setFanTokenAmount] = useState(payment.tokenAmount ?? 1);

  const [tokenName, tokenAddress] = payment.token.split(';');

  const [locked, setLocked] = useState(false);

  const isMobile = useMobile();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const handleTooltipToggle = () => {
    if (isMobile) {
      setIsTooltipOpen(!isTooltipOpen);
    }
  };

  const { isLoading: isPaymentTxLoading, data: paymentTx } = useFanTokenPaymentTx(
    tokenAddress as Address,
    fanTokenAmount,
    payment.receiverAddress ?? sender.identity.address,
    locked
  );

  const {
    isLoading: isPaymentOptionsLoading,
    data: paymentOptions,
    isError: isPaymentOptionsError
  } = useGlidePaymentOptions(Boolean(paymentTx), {
    commissionUSD: getCommissionUSD(payment.category),
    ...(paymentTx as any),
    approval: {
      token: MOXIE_CONTRACT_ADDRESS,
      amount: paymentTx?.args?.[1] ?? 0n
    },
    account: selectedFlow.wallets[0].address
  });

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
  const hasPaymentOption = !isLoading && paymentOption && paymentToken;

  const [paymentSuccessData, setPaymentSuccessData] = useState<PaymentSuccess | null>(
    payment.status === 'COMPLETED' ? { txHash: payment.hash as Hash } : null
  );
  const isGift = payment.receiverAddress !== sender.identity.address;

  const successMessage = `Successfully bought ${fanTokenAmount} ${tokenName} fan token(s) ${
    isGift ? `for @${recipientSocial.profileName}` : ''
  }`;

  const { shareFrameUrl, text, channelKey } = createShareUrls({
    tokenName,
    recipientSocial,
    isGift,
    tokenAmount: fanTokenAmount
  });

  const handleCopyLink = () => {
    copyToClipboard(shareFrameUrl);
    toast.success('Fan token frame link copied!');
  };

  const shareComponents = (
    <>
      <Button
        fullWidth
        onClick={() => {
          if (isMiniApp) {
            window.parent.postMessage(createCastPostMessage(text, shareFrameUrl, channelKey), '*');
          } else {
            window.open(createComposeCastUrl(text, shareFrameUrl, channelKey), '_blank');
          }
        }}
        startIcon={<SiFarcaster />}
        variant="outlined"
        size="small"
        color="inherit"
        sx={{
          fontSize: 14,
          fontWeight: 'normal',
          height: 45,
          '&:hover': {
            backgroundColor: 'action.hover'
          },
          borderRadius: 3,
          borderColor: 'divider',
          textTransform: 'none',
          justifyContent: 'flex-start',
          px: 2
        }}>
        Share on Farcaster
      </Button>
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        value={shareFrameUrl}
        slotProps={{
          input: {
            sx: {
              mt: 1,
              borderRadius: 3,
              fontSize: 14,
              height: 45
            },
            readOnly: true,
            endAdornment: (
              <Tooltip title="Copy frame link">
                <IconButton size="small" color="inherit" onClick={handleCopyLink} edge="end">
                  <TbCopy />
                </IconButton>
              </Tooltip>
            )
          }
        }}
      />
    </>
  );

  const [comment, setComment] = useState('');

  return paymentSuccessData ? (
    <PaymentSuccessDialog
      message={successMessage}
      receiptUrl={getReceiptUrl({ ...payment, hash: paymentSuccessData.txHash }, false)}
      shareComponents={shareComponents}
    />
  ) : (
    <BasePaymentDialog
      alwaysShowBackButton={alwaysShowBackButton}
      title={props.title ?? 'Buy Fan Tokens'}
      subtitle="Moxie Fan Token"
      expiresAt={payment?.expiresAt}
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
          senderFlow={selectedFlow}
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
          <Box display="flex" alignItems="center">
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
            <Tooltip
              title="The fan token price is based on bonding curve. To ensure your transaction succeeds, 10% price slippage applies."
              arrow
              disableFocusListener
              disableTouchListener={!isMobile}
              open={isMobile ? isTooltipOpen : undefined}
              onClose={() => isMobile && setIsTooltipOpen(false)}
              slotProps={{
                tooltip: {
                  sx: {
                    textAlign: 'center',
                    fontWeight: 'bold',
                    maxWidth: 200,
                    textWrap: 'pretty',
                    p: 1,
                    borderRadius: 5
                  }
                }
              }}>
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
            </Tooltip>
          </Box>
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
          step={1}
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
          payment={{ ...payment, tokenAmount: fanTokenAmount }}
          paymentToken={paymentToken}
          setPaymentToken={setPaymentToken}
          compatibleWallets={compatibleWallets}
          enabledChainCurrencies={paymentOptions?.map((c) => c.paymentCurrency.toLowerCase()) ?? []}
        />
      </Box>
    </BasePaymentDialog>
  );
}
