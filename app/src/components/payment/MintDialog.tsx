import {
  DialogProps,
  Stack,
  Box,
  Typography,
  Skeleton,
  Avatar,
  Tooltip,
  IconButton,
  TextField,
  Button
} from '@mui/material';
import { CloseCallbackType } from '../../types/CloseCallbackType';
import { getCommissionUSD, getPaymentOption } from '../../utils/glide';
import { useChainId } from 'wagmi';
import { SelectedIdentityType } from '../../types/ProfileType';
import { FarcasterRecipientField } from '../FarcasterRecipientField';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { PaymentType } from '../../types/PaymentType';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { useMemo, useState, useEffect, useContext } from 'react';
import { Token } from '@payflow/common';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { useGlidePaymentOptions } from '../../utils/hooks/useGlidePayment';
import { toast } from 'react-toastify';
import { Social } from '../../generated/graphql/types';
import { red } from '@mui/material/colors';
import { useCompatibleWallets } from '../../utils/hooks/useCompatibleWallets';
import { MintMetadata, mintProviderNameMap } from '../../utils/mint';
import { useMintPaymentTx } from '../../utils/hooks/useMintPaymentTx';
import { PayButton, PaymentSuccess } from '../buttons/PayButton';
import PaymentSuccessDialog from '../dialogs/PaymentSuccessDialog';
import { getReceiptUrl } from '../../utils/receipts';
import { SiFarcaster } from 'react-icons/si';
import { TbCopy } from 'react-icons/tb';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { createShareUrls } from '../../utils/mint';
import { createCastPostMessage, createComposeCastUrl } from '../../utils/warpcast';
import { QuantitySelector } from './QuantitySelector';
import { BasePaymentDialog } from './BasePaymentDialog';
import { FlowSelector } from './FlowSelector';
import { Hash } from 'viem';
import { ProfileContext } from '../../contexts/UserContext';
import { CommentField } from './CommentField';
import FrameV2SDK from '@farcaster/frame-sdk';

export type MintDialogProps = DialogProps &
  CloseCallbackType & {
    sender: SelectedIdentityType;
    payment: PaymentType;
    senderSocial: Social;
    recipientSocial: Social;
    mint: MintMetadata;
    alwaysShowBackButton?: boolean;
  };

export default function MintDialog({
  alwaysShowBackButton = false,
  sender,
  payment,
  senderSocial,
  recipientSocial,
  mint,
  closeStateCallback,
  ...props
}: MintDialogProps) {
  const { isMiniApp, isFrameV2 } = useContext(ProfileContext);

  const [selectedFlow, setSelectedFlow] = useState<FlowType>(
    sender.identity.profile?.defaultFlow ?? (sender.identity.profile?.flows?.[0] as FlowType)
  );

  const chainId = useChainId();

  const [paymentWallet, setPaymentWallet] = useState<FlowWalletType>();
  const [paymentToken, setPaymentToken] = useState<Token>();

  const [mintCount, setMintCount] = useState(1);
  const isGift = payment.receiverAddress !== sender.identity.address;

  const [zoraCommentEnabled, setTxCommentEnabled] = useState(false);
  const [comment, setComment] = useState('');

  const {
    data: mintData,
    isLoading: isMintLoading,
    isError: isMintPaymentTxError,
    error: mintPaymentTxError
  } = useMintPaymentTx({
    mint,
    minter: selectedFlow.wallets[0].address,
    recipient: payment.receiverAddress ?? sender.identity.address,
    amount: mintCount
  });

  const paymentTx = mintData?.paymentTx;
  const mintStatus = mintData?.mintStatus;
  const secondary = mintData?.secondary;

  useEffect(() => {
    if (mint.provider === 'zora.co' && !zoraCommentEnabled) {
      setTxCommentEnabled(Boolean(mintStatus === 'live' && !secondary));
    }
  }, [mintStatus, secondary]);

  console.log('Mint tx: ', paymentTx);

  const {
    isLoading: isPaymentOptionsLoading,
    data: paymentOptions,
    isError: isPaymentOptionsError,
    error: paymentOptionsError
  } = useGlidePaymentOptions(Boolean(paymentTx) && mintStatus === 'live', {
    commissionUSD: getCommissionUSD(payment),
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

  const isLoading = isMintLoading || isPaymentOptionsLoading;
  const hasPaymentOption =
    !isLoading && paymentOption && paymentToken && mintStatus === 'live' && !isMintPaymentTxError;

  const [paymentSuccessData, setPaymentSuccessData] = useState<PaymentSuccess | null>(
    payment.status === 'COMPLETED' ? { txHash: payment.hash as Hash } : null
  );

  const successMessage = `minted ${mintCount > 1 ? `${mintCount}x ` : ''}"${
    mint.metadata.name
  }" for @${recipientSocial.profileName}`;

  const { shareFrameUrl, text, channelKey } = createShareUrls({
    mint,
    recipientSocial,
    profile: sender.identity.profile!,
    isGift,
    tokenAmount: mintCount
  });

  const handleCopyLink = () => {
    copyToClipboard(shareFrameUrl);
    toast.success('Mint frame link copied!');
  };

  const shareComponents = useMemo(
    () => (
      <>
        <Stack direction="row" spacing={1}>
          <Button
            fullWidth
            onClick={() => {
              if (isFrameV2) {
                FrameV2SDK.actions.openUrl(createComposeCastUrl(text, shareFrameUrl, channelKey));
              } else if (isMiniApp) {
                window.parent.postMessage(
                  createCastPostMessage(text, shareFrameUrl, channelKey),
                  '*'
                );
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
              '&:hover': { backgroundColor: 'action.hover' },
              borderRadius: 3,
              borderColor: 'divider',
              textTransform: 'none'
            }}>
            Cast
          </Button>

          <Button
            fullWidth
            onClick={handleCopyLink}
            startIcon={<TbCopy />}
            variant="outlined"
            size="small"
            color="inherit"
            sx={{
              fontSize: 14,
              fontWeight: 'normal',
              height: 45,
              '&:hover': { backgroundColor: 'action.hover' },
              borderRadius: 3,
              borderColor: 'divider',
              textTransform: 'none'
            }}>
            Copy link
          </Button>
        </Stack>
      </>
    ),
    [text, shareFrameUrl, channelKey, isFrameV2, isMiniApp]
  );

  return paymentSuccessData ? (
    <PaymentSuccessDialog
      message={successMessage}
      receiptUrl={getReceiptUrl({ ...payment, hash: paymentSuccessData.txHash }, false)}
      shareComponents={shareComponents}
      completedAt={new Date(payment?.completedAt ?? Date.now())}
    />
  ) : (
    <BasePaymentDialog
      alwaysShowBackButton={alwaysShowBackButton}
      title={props.title ?? 'Mint Payment'}
      subtitle={`${mintProviderNameMap[mint.provider] ?? 'Mint'} Collectible`}
      expiresAt={payment?.expiresAt}
      closeStateCallback={closeStateCallback}
      {...props}
      footerContent={
        <PayButton
          paymentToken={paymentToken}
          buttonText={
            mintStatus === 'ended'
              ? 'Mint Ended'
              : mintStatus === 'upcoming'
                ? 'Mint Not Started'
                : secondary
                  ? 'Buy On Secondary'
                  : 'Mint'
          }
          disabled={!hasPaymentOption}
          paymentTx={paymentTx}
          paymentWallet={paymentWallet!}
          paymentOption={paymentOption!}
          payment={{ ...payment, tokenAmount: mintCount, comment }}
          senderFlow={selectedFlow}
          onSuccess={setPaymentSuccessData}
          onError={(error) => {
            toast.error(`Failed to mint "${mint.metadata.name}"`, { autoClose: 2000 });
            console.error(`Failed to mint with error`, error);
          }}
        />
      }>
      <Box ml={1}>
        <FarcasterRecipientField variant="text" social={recipientSocial} />
      </Box>
      <Stack flex={1} alignItems="center" justifyContent="center" spacing={1} overflow="auto">
        <Tooltip
          title={mint.metadata.description}
          arrow
          disableFocusListener
          sx={{ fontWeight: 'bold' }}
          slotProps={{
            tooltip: { sx: { p: 1, borderRadius: 5, fontWeight: 'bold' } }
          }}>
          <Stack
            p={1}
            maxWidth={250}
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}>
            <Avatar
              variant="rounded"
              src={mint.metadata.image}
              sx={{
                width: 64,
                height: 64
              }}
            />
            <Stack alignItems="flex-start" spacing={0.5}>
              <Typography fontSize={18} fontWeight="bold">
                {mint.metadata.name}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {mint.collectionName}
              </Typography>
            </Stack>
          </Stack>
        </Tooltip>

        <QuantitySelector quantity={mintCount} min={1} max={10} setQuantity={setMintCount} />

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
            {mintStatus === 'ended' && 'Mint has ended'}
            {mintStatus === 'upcoming' && 'Mint has not started yet'}
            {mintStatus === 'sold' && 'Mint is sold out'}
            {isMintPaymentTxError &&
              (mintPaymentTxError?.message ?? 'Failed to load payment transaction')}
            {(paymentOptions?.length === 0 || isPaymentOptionsError) &&
              (paymentOptionsError?.message ?? 'Balance not enough. Switch payment flow!')}
          </Typography>
        )}

        <Typography fontSize={12} color="text.secondary">
          fee:{' $'}
          {getCommissionUSD(payment)}
        </Typography>

        <CommentField
          disabled={
            !mintStatus || mintStatus !== 'live' || isMintPaymentTxError || isPaymentOptionsError
          }
          comment={comment}
          setComment={setComment}
        />
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
