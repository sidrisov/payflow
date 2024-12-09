import { useContext, useState, useCallback, useEffect } from 'react';
import { useChainId, useSwitchChain, useWalletClient, useClient } from 'wagmi';
import { createSession, executeSession, PaymentOption } from '@paywithglide/glide-js';
import { ProfileContext } from '../../contexts/UserContext';
import { submitPayment, updatePayment } from '../../services/payments';
import { PaymentTxStatus, PaymentType } from '../../types/PaymentType';
import { getCommissionUSD, glideConfig } from '../glide';
import { useRegularTransfer } from './useRegularTransfer';
import { useSafeTransfer } from './useSafeTransfer';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { Address, Hash } from 'viem';
import { useFarcasterTransfer } from './useFarcasterTransfer';

export const usePayflowTransaction = (isNativeFlow: boolean) => {
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: signer } = useWalletClient();
  const client = useClient();
  const { profile, isMiniApp, isFrameV2 } = useContext(ProfileContext);

  const {
    transfer,
    reset: resetSafe,
    loading: loadingSafe,
    confirmed: confirmedSafe,
    error: errorSafe,
    status: statusSafe,
    txHash: txHashSafe
  } = useSafeTransfer();
  const {
    sendTransactionAsync,
    reset: resetRegular,
    loading: loadingRegular,
    confirmed: confirmedRegular,
    error: errorRegular,
    status: statusRegular,
    txHash: txHashRegular
  } = useRegularTransfer();

  const {
    sendTransactionAsync: sendTransactionFarcaster,
    reset: resetFarcaster,
    loading: loadingFarcaster,
    confirmed: confirmedFarcaster,
    error: errorFarcaster,
    status: statusFarcaster,
    txHash: txHashFarcaster
  } = useFarcasterTransfer();

  const [paymentTxStatus, setPaymentTxStatus] = useState<PaymentTxStatus>({
    isPending: false,
    isConfirmed: false,
    error: false,
    txHash: null,
    status: ''
  });

  const [glideStatus, setGlideStatus] = useState<PaymentTxStatus>({
    isPending: false,
    isConfirmed: false,
    error: false,
    txHash: null,
    status: ''
  });

  const checkDependencies = useCallback(() => {
    if (!profile) throw new Error('Profile not found. Please ensure you are logged in.');

    if (isNativeFlow || !isMiniApp || isFrameV2) {
      if (!client) throw new Error('Client not initialized. Please check your network connection.');
      if (!signer) throw new Error('Signer not available. Please connect your wallet.');
    }
  }, [profile, client, signer, isMiniApp, isFrameV2, isNativeFlow]);

  const createGlideSession = useCallback(
    async (paymentTx: any, paymentOption: PaymentOption, commissionUSD: number) => {
      checkDependencies();

      setGlideStatus((prevStatus) => ({
        ...prevStatus,
        isPending: true,
        status: 'Creating Glide session'
      }));

      try {
        const session = await createSession(glideConfig, {
          paymentCurrency: paymentOption.paymentCurrency,
          commissionUSD,
          ...(paymentTx as any)
        });

        setGlideStatus((prevStatus) => ({
          ...prevStatus,
          status: 'Fulfilling payment'
        }));

        return session;
      } catch (error) {
        console.error('Error creating Glide session:', error);
        setGlideStatus((prevStatus) => ({
          ...prevStatus,
          isPending: false,
          error: true,
          status: 'Failed to fulfill payment'
        }));
        throw error;
      }
    },
    [checkDependencies]
  );

  const handlePayment = async (
    tx: any,
    paymentWallet: FlowWalletType,
    senderFlow: FlowType
  ): Promise<Hash> => {
    if (!profile) throw new Error('Profile not found. Please ensure you are logged in.');

    if (!isNativeFlow && isMiniApp && !isFrameV2) {
      return (await sendTransactionFarcaster(tx)) as Hash;
    }

    if (!client) throw new Error('Client not initialized. Please check your network connection.');
    if (!signer) throw new Error('Signer not available. Please connect your wallet.');

    if (isNativeFlow) {
      const owners: Address[] = [];
      if (
        senderFlow.signerProvider &&
        senderFlow.signer.toLowerCase() !== profile.identity.toLowerCase()
      ) {
        owners.push(profile.identity);
      }
      owners.push(senderFlow.signer);

      const safeAccountConfig: { owners: Address[]; threshold: number } = {
        owners,
        threshold: 1
      };

      const saltNonce = senderFlow.saltNonce as string;
      const safeVersion = paymentWallet.version;

      return (await transfer(
        client,
        signer,
        {
          from: paymentWallet.address,
          to: tx.to,
          data: tx.data && tx.data.length ? tx.data : undefined,
          value: tx.value
        },
        safeAccountConfig,
        safeVersion,
        saltNonce
      )) as Hash;
    } else {
      return (await sendTransactionAsync(tx)) as Hash;
    }
  };

  const handleDirectPayment = async (
    tx: any,
    paymentWallet: FlowWalletType,
    payment: PaymentType,
    senderFlow: FlowType
  ): Promise<{ success: boolean; txHash: Hash }> => {
    const txHash = await handlePayment(tx, paymentWallet, senderFlow);

    payment.hash = txHash;

    if (payment.referenceId) {
      await updatePayment(payment);
    } else {
      await submitPayment(payment);
    }

    return { success: true, txHash };
  };

  const handleCrossChainPayment = async ({
    paymentTx,
    paymentWallet,
    paymentOption,
    payment,
    senderFlow
  }: {
    paymentTx: any;
    paymentWallet: FlowWalletType;
    paymentOption: PaymentOption;
    payment: PaymentType;
    senderFlow: FlowType;
  }) => {
    try {
      checkDependencies();

      if (isNativeFlow) {
        resetSafe();
      } else if (isMiniApp && !isFrameV2) {
        resetFarcaster();
      } else {
        resetRegular();
      }

      const commissionUSD = getCommissionUSD(payment);
      const session = await createGlideSession(paymentTx, paymentOption, commissionUSD);

      const glideResponse = await executeSession(glideConfig, {
        session,
        currentChainId:
          isNativeFlow || !isMiniApp || isFrameV2 ? (chainId as any) : paymentTx.chainId,
        switchChainAsync,
        sendTransactionAsync: async (tx) => {
          console.log('Glide tnxs: ', tx);

          const txHash = await handlePayment(tx, paymentWallet, senderFlow);

          if (txHash) {
            payment.fulfillmentId = session.sessionId;
            payment.fulfillmentChainId = tx.chainId;
            payment.fulfillmentHash = txHash;

            await updatePayment(payment);
          }

          return txHash as Hash;
        }
      });

      console.log('Glide response:', { glideExecutionResponse: glideResponse });
      const glideTxHash = glideResponse.sponsoredTransactionHash;

      if (glideTxHash && payment.referenceId) {
        payment.hash = glideTxHash;
        updatePayment(payment);

        setGlideStatus({
          isPending: false,
          isConfirmed: true,
          error: false,
          txHash: glideTxHash,
          status: 'Fulfilled'
        });

        return { success: true, txHash: glideTxHash as Hash };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Glide transaction error:', error);
      setGlideStatus({
        isPending: false,
        isConfirmed: false,
        error: true,
        txHash: null,
        status: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  };

  useEffect(() => {
    const transferStatus = (() => {
      if (!isNativeFlow && isMiniApp && !isFrameV2) {
        return {
          isPending: Boolean(
            loadingFarcaster || (txHashFarcaster && !confirmedFarcaster && !errorFarcaster)
          ),
          isConfirmed: Boolean(confirmedFarcaster),
          error: Boolean(errorFarcaster),
          txHash: txHashFarcaster,
          status: statusFarcaster
        };
      }
      return isNativeFlow
        ? {
            isPending: Boolean(loadingSafe || (txHashSafe && !confirmedSafe && !errorSafe)),
            isConfirmed: Boolean(confirmedSafe),
            error: Boolean(errorSafe),
            txHash: txHashSafe,
            status: statusSafe
          }
        : {
            isPending: Boolean(
              loadingRegular || (txHashRegular && !confirmedRegular && !errorRegular)
            ),
            isConfirmed: Boolean(confirmedRegular),
            error: Boolean(errorRegular),
            txHash: txHashRegular,
            status: statusRegular
          };
    })();

    setPaymentTxStatus({
      isPending: transferStatus.isPending || glideStatus.isPending,
      isConfirmed: transferStatus.isConfirmed && glideStatus.isConfirmed,
      error: transferStatus.error || glideStatus.error,
      txHash: glideStatus.txHash || transferStatus.txHash || null,
      status: transferStatus.isConfirmed ? glideStatus.status : transferStatus.status || 'Loading'
    });
  }, [
    isMiniApp,
    isFrameV2,
    isNativeFlow,
    loadingSafe,
    txHashSafe,
    confirmedSafe,
    errorSafe,
    statusSafe,
    loadingRegular,
    txHashRegular,
    confirmedRegular,
    errorRegular,
    statusRegular,
    loadingFarcaster,
    txHashFarcaster,
    confirmedFarcaster,
    errorFarcaster,
    statusFarcaster,
    glideStatus
  ]);

  return { handleDirectPayment, handleCrossChainPayment, paymentTxStatus };
};
