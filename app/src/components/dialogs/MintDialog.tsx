import {
  Dialog,
  DialogContent,
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
import { getPaymentOption } from '../../utils/glide';
import { useChainId } from 'wagmi';
import { BackDialogTitle } from './BackDialogTitle';
import { SenderField } from '../SenderField';
import { KeyboardDoubleArrowDown, Add, Remove } from '@mui/icons-material';
import { SelectedIdentityType } from '../../types/ProfileType';
import { FarcasterRecipientField } from '../FarcasterRecipientField';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { PaymentType } from '../../types/PaymentType';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { useContext, useMemo, useState, useEffect } from 'react';
import { Token } from '../../utils/erc20contracts';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { useGlidePaymentOptions } from '../../utils/hooks/useGlidePayment';
import { ProfileContext } from '../../contexts/UserContext';
import { toast } from 'react-toastify';
import { Social } from '../../generated/graphql/types';
import { grey, red } from '@mui/material/colors';
import { ChooseFlowDialog } from './ChooseFlowDialog';
import { UpSlideTransition } from './TransitionDownUpSlide';
import PoweredByGlideText from '../text/PoweredByGlideText';
import { useCompatibleWallets } from '../../utils/hooks/useCompatibleWallets';
import { MintMetadata } from '../../utils/mint';
import { useMintPaymentTx } from '../../utils/hooks/useMintPaymentTx';
import { PayButton } from '../buttons/PayButton';
import { useDarkMode } from '../../utils/hooks/useDarkMode';
import { useMiniApp, useMobile } from '../../utils/hooks/useMobile';
import PaymentSuccessDialog from './PaymentSuccessDialog';
import { getReceiptUrl } from '../../utils/receipts';
import React from 'react';
import { SiFarcaster } from 'react-icons/si';
import { TbCopy } from 'react-icons/tb';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { createShareUrls } from '../../utils/mint';
import { useDebounce } from 'use-debounce';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { createCastPostMessage, createComposeCastUrl } from '../../utils/warpcast';

export type MintDialogProps = DialogProps &
  CloseCallbackType & {
    sender: SelectedIdentityType;
    payment: PaymentType;
    senderSocial: Social;
    recipientSocial: Social;
    mint: MintMetadata;
  } & {
    alwaysShowBackButton?: boolean;
    flows?: FlowType[];
    selectedFlow?: FlowType;
    setSelectedFlow?: React.Dispatch<React.SetStateAction<FlowType | undefined>>;
  };

type CommentFieldProps = {
  disabled: boolean;
  comment: string;
  setComment: React.Dispatch<React.SetStateAction<string>>;
  zoraCommentEnabled: boolean;
};

const CommentField: React.FC<CommentFieldProps> = ({
  disabled,
  comment,
  setComment,
  zoraCommentEnabled
}) => {
  const isMobile = useMobile();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <TextField
      // TODO: also, check if not in pending payment state
      disabled={disabled}
      fullWidth
      variant="outlined"
      size="small"
      placeholder="Add a comment..."
      value={comment}
      onChange={(e) => setComment(e.target.value)}
      multiline
      sx={{
        mt: 1,
        '& .MuiOutlinedInput-root': {
          borderRadius: 5,
          fontSize: 14,
          height: 'auto',
          '&.Mui-focused fieldset': {
            border: 1,
            borderColor: 'inherit'
          }
        },
        '& .MuiInputBase-input': {
          padding: '8px 12px'
        }
      }}
      slotProps={{
        input: {
          endAdornment: (
            <Tooltip
              title={
                zoraCommentEnabled
                  ? 'Comment will be added to payflow and zora.co'
                  : 'Comment will be added only to payflow'
              }
              arrow
              open={isMobile ? showTooltip : undefined}
              disableFocusListener={isMobile}
              disableHoverListener={isMobile}
              disableTouchListener={isMobile}>
              <IconButton
                disabled={disabled}
                size="small"
                onClick={() => isMobile && setShowTooltip(!showTooltip)}>
                <InfoOutlinedIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          )
        }
      }}
    />
  );
};

export default function MintDialog({
  alwaysShowBackButton = false,
  sender,
  payment,
  senderSocial,
  recipientSocial,
  mint,
  closeStateCallback,
  flows,
  selectedFlow,
  setSelectedFlow,
  ...props
}: MintDialogProps) {
  const isMobile = useMobile();
  const prefersDarkMode = useDarkMode();
  const miniApp = useMiniApp();

  const [openSelectFlow, setOpenSelectFlow] = useState(false);

  const senderFlow = sender.identity.profile?.defaultFlow as FlowType;

  const isNativeFlow = senderFlow.type !== 'FARCASTER_VERIFICATION' && senderFlow.type !== 'LINKED';

  // force to display sponsored
  const [gasFee] = useState<bigint | undefined>(isNativeFlow ? BigInt(0) : undefined);

  const chainId = useChainId();

  const { profile } = useContext(ProfileContext);

  const [paymentWallet, setPaymentWallet] = useState<FlowWalletType>();
  const [paymentToken, setPaymentToken] = useState<Token>();

  const [mintCount, setMintCount] = useState(1);
  const isGift = payment.receiverAddress !== profile?.identity;

  const [zoraCommentEnabled, setTxCommentEnabled] = useState(false);

  const payflowCommentSection = `${
    isGift ? `Gifted to @${recipientSocial.profileName}` : 'Minted'
  } by @${senderSocial.profileName} via @payflow`;
  const [comment, setComment] = useState('');
  const [debouncedComment] = useDebounce(comment, 1000);

  const {
    data: mintData,
    isLoading: isMintLoading,
    isError: isMintPaymentTxError,
    error: mintPaymentTxError
  } = useMintPaymentTx({
    mint,
    minter: senderFlow.wallets[0].address,
    recipient: payment.receiverAddress ?? profile?.identity,
    comment: zoraCommentEnabled
      ? `${payflowCommentSection}${debouncedComment ? `:\n\n"${debouncedComment}"` : ''}`
      : undefined,
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

  const isLoading = isMintLoading || isPaymentOptionsLoading;
  const hasPaymentOption =
    !isLoading && paymentOption && paymentToken && mintStatus === 'live' && !isMintPaymentTxError;

  const [showSuccessDialog, setShowSuccessDialog] = useState(true);

  const successMessage = `minted ${mintCount > 1 ? `${mintCount}x ` : ''}"${
    mint.metadata.name
  }" for @${recipientSocial.profileName}`;
  const receiptUrl = getReceiptUrl(payment, false);

  const { shareFrameUrl, text, channelKey } = createShareUrls({
    mint,
    recipientSocial,
    profile: profile!,
    isGift,
    tokenAmount: mintCount
  });

  const handleCopyLink = () => {
    copyToClipboard(shareFrameUrl);
    toast.success('Mint frame link copied!');
  };

  const shareComponents = (
    <>
      <Button
        fullWidth
        onClick={() => {
          if (miniApp) {
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
            title={props.title ?? 'Mint Payment'}
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
              <Stack alignItems="center" justifyContent="start" spacing={0} width="100%">
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
                      <Typography variant="subtitle2" color={grey[prefersDarkMode ? 400 : 700]}>
                        {mint.collectionName}
                      </Typography>
                    </Stack>
                  </Stack>
                </Tooltip>

                <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                  <IconButton onClick={() => setMintCount((prev) => Math.max(prev - 1, 1))}>
                    <Remove fontSize="small" sx={{ color: 'text.secondary' }} />
                  </IconButton>
                  <Typography variant="h5" fontWeight="bold">
                    {mintCount}
                  </Typography>
                  <IconButton onClick={() => setMintCount((prev) => Math.min(prev + 1, 10))}>
                    <Add fontSize="small" sx={{ color: 'text.secondary' }} />
                  </IconButton>
                </Stack>

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
                      (paymentOptionsError?.message ??
                        "You don't have any balance to cover mint cost. Switch to a different payment flow!")}
                  </Typography>
                )}

                <CommentField
                  disabled={
                    !mintStatus ||
                    mintStatus !== 'live' ||
                    isMintPaymentTxError ||
                    isPaymentOptionsError
                  }
                  comment={comment}
                  setComment={setComment}
                  zoraCommentEnabled={zoraCommentEnabled}
                />
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
                senderFlow={senderFlow}
                onSuccess={() => {
                  setShowSuccessDialog(true);
                }}
                onError={(error) => {
                  toast.error(`Failed to mint "${mint.metadata.name}"`, { autoClose: 2000 });
                  console.error(`Failed to mint with error`, error);
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
        shareComponents={shareComponents}
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
