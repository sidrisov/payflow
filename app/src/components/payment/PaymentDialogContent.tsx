import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, useChainId, useClient, useSwitchChain, useWalletClient } from 'wagmi';
import { Id, toast } from 'react-toastify';

import {
  Abi,
  Account,
  Address,
  Chain,
  Client,
  ContractFunctionArgs,
  ContractFunctionName,
  Hash,
  Transport,
  WalletClient,
  encodeFunctionData,
  erc20Abi,
  parseUnits
} from 'viem';

import { FlowType, FlowWalletType } from '../../types/FlowType';
import { ProfileType } from '../../types/ProfileType';
import { ProfileContext } from '../../contexts/UserContext';
import { useSafeTransfer, ViemTransaction } from '../../utils/hooks/useSafeTransfer';
import { updateWallet } from '../../services/flow';
import { TransferToastContent } from '../toasts/TransferToastContent';
import { LoadingSwitchChainButton } from '../buttons/LoadingSwitchNetworkButton';
import { CustomLoadingButton } from '../buttons/LoadingPaymentButton';
import { PaymentDialogProps } from './PaymentDialog';
import { ERC20_CONTRACTS, Token } from '../../utils/erc20contracts';
import { useCompatibleWallets, useToAddress } from '../../utils/hooks/useCompatibleWallets';
import { updatePayment, submitPayment } from '../../services/payments';
import { NetworkTokenSelector } from '../NetworkTokenSelector';
import { useRegularTransfer } from '../../utils/hooks/useRegularTransfer';
import { PaymentType } from '../../types/PaymentType';
import { delay } from '../../utils/delay';
import { Skeleton, Stack, Typography, useMediaQuery } from '@mui/material';
import ResponsiveDialog from '../dialogs/ResponsiveDialog';
import { grey, red } from '@mui/material/colors';
import PoweredByGlideText from '../text/PoweredByGlideText';
import { useGlideEstimatePayment, useGlidePaymentOptions } from '../../utils/hooks/useGlidePayment';
import { useTokenPrices } from '../../utils/queries/prices';
import { CAIP19, createSession, executeSession } from '@paywithglide/glide-js';
import { degen } from 'viem/chains';
import { formatAmountWithSuffix, normalizeNumberPrecision } from '../../utils/formats';
import { glideConfig } from '../../utils/glide';
import { useDarkMode } from '../../utils/hooks/useDarkMode';
import { TokenAmountSection } from '../dialogs/TokenAmountSection';
import { SwitchFlowSignerSection } from '../dialogs/SwitchFlowSignerSection';

export default function PaymentDialogContent({
  paymentType,
  payment,
  sender,
  recipient
}: PaymentDialogProps) {
  const prefersDarkMode = useDarkMode();

  const senderAddress = sender.identity.address as Address;
  const senderFlow = sender.identity.profile?.defaultFlow as FlowType;

  const { profile } = useContext(ProfileContext);

  const { data: signer } = useWalletClient();
  const client = useClient();

  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const [paymentPending, setPaymentPending] = useState<boolean>(false);
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

  const sendToastId = useRef<Id>();

  const isNativeFlow =
    paymentType === 'payflow' &&
    senderFlow.type !== 'FARCASTER_VERIFICATION' &&
    senderFlow.type !== 'LINKED';

  const { data: tokenPrices } = useTokenPrices();

  const { loading, confirmed, error, status, txHash, transfer, reset } = useSafeTransfer();

  const [openConnectSignerDrawer, setOpenConnectSignerDrawer] = useState<boolean>(false);
  const [switchChain, setSwitchChain] = useState<boolean>(false);

  const {
    loading: loadingRegular,
    confirmed: confirmedRegular,
    error: errorRegular,
    status: statusRegular,
    txHash: txHashRegular,
    sendTransactionAsync,
    reset: resetRegular
  } = useRegularTransfer();

  function prepareGlideTx(payment?: PaymentType) {
    if (!payment) {
      return;
    }

    const paymentChainId = payment.chainId;
    const paymentToken = ERC20_CONTRACTS.find(
      (t) => t.chainId === paymentChainId && t.id === payment.token
    );

    if (!paymentToken || !toAddress || !tokenPrices) {
      return;
    }

    const value = parseUnits(
      payment.tokenAmount
        ? payment.tokenAmount.toString()
        : (payment.usdAmount / tokenPrices[paymentToken.id]).toString(),
      paymentToken.decimals
    );

    const paymentTx = (
      paymentToken.tokenAddress
        ? {
            chainId: paymentChainId,
            address: paymentToken.tokenAddress,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [toAddress, value]
          }
        : {
            chainId: paymentChainId,
            address: toAddress,
            value
          }
    ) as {
      chainId: number;
      address: Address;
      abi?: Abi;
      functionName?: ContractFunctionName;
      args?: ContractFunctionArgs;
      value?: bigint;
    };
    return paymentTx;
  }

  const paymentTx = prepareGlideTx(payment);

  const { isLoading: isPaymentOptionsLoading, data: paymentOptions } = useGlidePaymentOptions(
    crossChainMode,
    {
      account: senderFlow?.wallets[0].address,
      ...(paymentTx as any)
    }
  );

  // TODO: move everything to flows
  const compatibleWallets = useCompatibleWallets({
    sender: paymentType === 'payflow' ? senderFlow : senderAddress,
    recipient,
    payment,
    paymentOptions: crossChainMode && !isPaymentOptionsLoading ? paymentOptions : undefined
  });

  console.log('Compatible wallets: ', compatibleWallets);

  const { isLoading: isPaymentOptionLoading, data: paymentOption } = useGlideEstimatePayment(
    crossChainMode && Boolean(crossChainPaymentToken),
    {
      account: senderFlow?.wallets[0].address,
      paymentCurrency: `eip155:${crossChainPaymentToken?.chainId}/${
        crossChainPaymentToken?.tokenAddress
          ? `erc20:${crossChainPaymentToken.tokenAddress}`
          : crossChainPaymentToken?.chainId === degen.id
          ? 'slip44:33436'
          : 'slip44:60'
      }` as CAIP19,
      ...(paymentTx as any)
    }
  );

  console.log('Cross-chain payment options: ', isPaymentOptionsLoading, paymentOptions);

  // force to display sponsored
  const [gasFee] = useState<bigint | undefined>(isNativeFlow ? BigInt(0) : undefined);

  useEffect(() => {
    // reset cross-chain mode when flow changed
    setCrossChainMode(false);
  }, [senderFlow]);

  useMemo(async () => {
    setPaymentWallet(compatibleWallets?.[0]);
  }, [compatibleWallets]);

  const [crossChainPaymentTxPending, setCrossChainPaymentTxPending] = useState<boolean>();
  const [crossChainPaymentTxHash, setCrossChainPaymentTxHash] = useState<Hash>();
  const [crossChainPaymentTxError, setCrossChainPaymentTxError] = useState<boolean>();

  useMemo(async () => {
    if (!paymentAmountUSD || !paymentWallet) {
      return;
    }

    const loadingCombined = crossChainMode
      ? crossChainPaymentTxPending
      : isNativeFlow
      ? loading
      : loadingRegular;
    const confirmedCombined = isNativeFlow ? confirmed : confirmedRegular;
    const errorCombined = crossChainMode
      ? crossChainPaymentTxError
      : isNativeFlow
      ? error
      : errorRegular;
    const statusCombined = isNativeFlow ? status : statusRegular;
    const txHashCombined = crossChainMode
      ? crossChainPaymentTxHash
      : isNativeFlow
      ? txHash
      : txHashRegular;

    if (loadingCombined && !sendToastId.current) {
      toast.dismiss();
      sendToastId.current = toast.loading(
        <TransferToastContent
          from={sender}
          to={recipient}
          amount={paymentAmount ?? 0}
          token={paymentToken as Token}
        />
      );
    }

    if (!sendToastId.current) {
      return;
    }

    if (confirmedCombined && txHashCombined && (!crossChainMode || crossChainPaymentTxHash)) {
      console.debug('Confirmed with txHash: ', txHashCombined);

      toast.update(sendToastId.current, {
        render: (
          <TransferToastContent
            from={sender}
            to={recipient}
            amount={paymentAmount ?? 0}
            token={paymentToken as Token}
          />
        ),
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
      sendToastId.current = undefined;

      if (profile) {
        if (payment?.referenceId) {
          payment.hash = txHashCombined;
          await updatePayment(payment);
        } else {
          const newPayment = {
            type: 'APP',
            status: 'COMPLETED',
            receiver: recipient.identity.profile,
            receiverAddress: toAddress,
            chainId: chainId,
            token: paymentToken?.id,
            tokenAmount: paymentAmount,
            hash: txHashCombined
          } as PaymentType;

          console.log('Submitting payment: ', newPayment);
          await submitPayment(newPayment);
        }

        // if tx was successfull, mark wallet as deployed if it wasn't
        if (isNativeFlow && !paymentWallet.deployed) {
          paymentWallet.deployed = true;
          await updateWallet(senderFlow.uuid, paymentWallet);
        }
      }

      await delay(2000);
      window.location.href = '/';
    } else if (errorCombined) {
      toast.update(sendToastId.current, {
        render: (
          <TransferToastContent
            from={sender}
            to={recipient}
            amount={paymentAmount ?? 0}
            token={paymentToken as Token}
            status="error"
          />
        ),
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
      sendToastId.current = undefined;

      if (statusCombined === 'insufficient_fees') {
        toast.error('Insufficient gas fees', { closeButton: false, autoClose: 3000 });
      }

      if (statusCombined?.includes('gas_sponsorship_failure')) {
        toast.error(`Failed to sponsor tx: ${statusCombined.split(':')[1]}`, {
          closeButton: false,
          autoClose: 3000
        });
      }
    }
  }, [
    loading,
    confirmed,
    error,
    status,
    txHash,
    loadingRegular,
    confirmedRegular,
    errorRegular,
    statusRegular,
    txHashRegular,
    paymentAmountUSD,
    crossChainMode,
    crossChainPaymentTxPending,
    crossChainPaymentTxHash,
    crossChainPaymentTxError
  ]);

  const submitGlideTransaction = async () => {
    if (address?.toLowerCase() !== senderFlow.signer.toLowerCase()) {
      setOpenConnectSignerDrawer(true);
      return;
    }

    setCrossChainPaymentTxPending(true);
    try {
      if (
        profile &&
        payment &&
        paymentTx &&
        client &&
        signer &&
        paymentWallet &&
        paymentToken &&
        paymentOption
      ) {
        if (isNativeFlow) {
          reset();
        } else {
          resetRegular();
        }

        const session = await createSession(glideConfig, {
          account: paymentWallet.address,
          paymentCurrency: paymentOption.paymentCurrency,
          currentChainId: chainId,
          ...(paymentTx as any)
        });

        const { sponsoredTransactionHash: glideTxHash } = await executeSession(glideConfig, {
          session,
          currentChainId: chainId as any,
          switchChainAsync,
          sendTransactionAsync: async (tx) => {
            console.log('Glide tnxs: ', tx);

            const txUpdated = (
              isNativeFlow
                ? {
                    from: paymentWallet.address,
                    to: tx.to,
                    data: tx.data && tx.data.length > 0 ? tx.data : undefined,
                    value: tx.value
                  }
                : tx
            ) as ViemTransaction;

            const txHash = await submitTransaction(txUpdated);
            if (txHash) {
              payment.fulfillmentId = session.sessionId;
              payment.fulfillmentChainId = tx.chainId;
              payment.fulfillmentHash = txHash;
              updatePayment(payment);
            }
            return txHash as Hash;
          }
        });

        console.log('Glide txHash:', glideTxHash);

        if (glideTxHash && payment.referenceId) {
          setCrossChainPaymentTxHash(glideTxHash);
        } else {
          setCrossChainPaymentTxError(true);
          toast.error('Cross-chain payment failed!');
        }
      }
    } catch (error) {
      const message = (error as Error).message;
      toast.error(`Cross-chain payment failed: ${message}!`);
      console.error('Cross-chain payment failed with error: ', error);
      setCrossChainPaymentTxError(true);
    } finally {
      setCrossChainPaymentTxPending(false);
    }
  };

  async function submitTransaction(tx?: ViemTransaction) {
    if (paymentType !== 'wallet' && address?.toLowerCase() !== senderFlow.signer.toLowerCase()) {
      setOpenConnectSignerDrawer(true);
      return;
    }

    if (!paymentToken) {
      return;
    }

    if (chainId !== paymentToken.chainId && !isNativeFlow) {
      setSwitchChain(true);
      return;
    }

    if (
      paymentWallet &&
      toAddress &&
      paymentAmount &&
      paymentToken &&
      client &&
      signer &&
      profile
    ) {
      const amount = parseUnits(paymentAmount.toString(), paymentToken.decimals);
      const paymentTx =
        tx ??
        (paymentToken.tokenAddress
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
            });

      console.log('Here 2');

      let txHash;
      if (isNativeFlow) {
        reset();
        txHash = await sendSafeTransaction(
          client,
          signer,
          profile,
          senderFlow,
          paymentWallet.version,
          paymentTx
        );
      } else {
        resetRegular();
        txHash = await sendTransactionAsync?.(paymentTx);
      }

      return txHash;
    } else {
      toast.error("Can't send to this profile");
    }
  }

  async function sendSafeTransaction(
    client: Client<Transport, Chain>,
    signer: WalletClient<Transport, Chain, Account>,
    profile: ProfileType,
    flow: FlowType,
    version: string,
    tx: ViemTransaction
  ) {
    reset();

    // TODO: hard to figure out if there 2 signers or one, for now consider if signerProvider not specified - 1, otherwise - 2
    const owners: Address[] = [];
    if (flow.signerProvider && flow.signer.toLowerCase() !== profile.identity.toLowerCase()) {
      owners.push(profile.identity);
    }
    owners.push(flow.signer);

    const safeAccountConfig: { owners: Address[]; threshold: number } = {
      owners,
      threshold: 1
    };

    const saltNonce = flow.saltNonce as string;
    const safeVersion = version;

    return await transfer(client, signer, tx, safeAccountConfig, safeVersion, saltNonce);
  }

  useMemo(async () => {
    if (crossChainMode) {
      setPaymentPending(
        Boolean(crossChainPaymentTxPending || (!crossChainPaymentTxHash && !error))
      );
    } else if (isNativeFlow) {
      setPaymentPending(Boolean(loading || (txHash && !confirmed && !error)));
    } else {
      setPaymentPending(
        Boolean(loadingRegular || (txHashRegular && !confirmedRegular && !errorRegular))
      );
    }
  }, [
    loading,
    txHash,
    confirmed,
    error,
    loadingRegular,
    txHashRegular,
    confirmedRegular,
    errorRegular,
    crossChainPaymentTxPending,
    crossChainPaymentTxHash,
    crossChainPaymentTxError
  ]);

  // disable payment if address or amount are not defined
  useMemo(async () => {
    console.log('Checking payment enabled: ', toAddress, paymentAmount, paymentAmountUSD);
    if (!toAddress) {
      setPaymentEnabled(false);
    }
  }, [toAddress]);

  useMemo(async () => {
    if (crossChainMode) {
      setPaymentEnabled(Boolean(paymentOption));
    }
  }, [crossChainMode, paymentOption]);

  useMemo(async () => {
    if (
      isNativeFlow &&
      address?.toLowerCase() === senderFlow.signer.toLowerCase() &&
      paymentToken?.chainId
    ) {
      await switchChainAsync({ chainId: paymentToken.chainId });
    }
  }, [isNativeFlow, address, senderFlow, paymentToken?.chainId]);

  return (
    <>
      <Stack mt={1} alignItems="center">
        {crossChainMode &&
          (isPaymentOptionLoading || isPaymentOptionsLoading ? (
            <Skeleton
              title="fetching price"
              variant="rectangular"
              sx={{ borderRadius: 3, height: 45, width: 100 }}
            />
          ) : paymentOptions && paymentOption ? (
            <Typography fontSize={30} fontWeight="bold" textAlign="center">
              {formatAmountWithSuffix(
                normalizeNumberPrecision(parseFloat(paymentOption.paymentAmount))
              )}{' '}
              {paymentOption.currencySymbol}
            </Typography>
          ) : (
            <Typography fontSize={14} fontWeight="bold" color={red.A400} textAlign="center">
              You don't have any balance to cover cross-chain payment, switch to different payment
              flow!
            </Typography>
          ))}
      </Stack>

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
      {switchChain ? (
        <LoadingSwitchChainButton
          lazy={false}
          onSuccess={() => setSwitchChain(false)}
          chainId={
            crossChainMode
              ? (crossChainPaymentToken?.chainId as number)
              : (paymentToken?.chainId as number)
          }
        />
      ) : (
        <CustomLoadingButton
          title="Pay"
          loading={paymentPending}
          disabled={!paymentEnabled}
          status={isNativeFlow ? status : statusRegular}
          onClick={async () => {
            if (crossChainMode) {
              await submitGlideTransaction();
            } else {
              await submitTransaction();
            }
          }}
        />
      )}
      {crossChainMode && <PoweredByGlideText />}

      {paymentType !== 'wallet' && address?.toLowerCase() !== senderFlow.signer.toLowerCase() && (
        <ResponsiveDialog
          title="Connect Signer"
          open={openConnectSignerDrawer}
          onOpen={() => {
            setOpenConnectSignerDrawer(true);
          }}
          onClose={() => setOpenConnectSignerDrawer(false)}>
          <Stack alignItems="flex-start" spacing={2}>
            <Typography variant="caption" color={grey[prefersDarkMode ? 400 : 700]}>
              Selected payment flow `<b>{senderFlow.title}`</b> signer is not connected! Please,
              proceed with connecting the signer mentioned below:
            </Typography>
            <SwitchFlowSignerSection
              onSwitch={() => setOpenConnectSignerDrawer(false)}
              flow={senderFlow}
            />
          </Stack>
        </ResponsiveDialog>
      )}
    </>
  );
}
