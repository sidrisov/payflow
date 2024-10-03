import { useContext, useState, useEffect } from 'react';
import { useChainId, useSwitchChain, useWalletClient, useClient } from 'wagmi';
import { createSession, executeSession, PaymentOption } from '@paywithglide/glide-js';
import { ProfileContext } from '../../contexts/UserContext';
import { updatePayment } from '../../services/payments';
import { PaymentTxStatus, PaymentType } from '../../types/PaymentType';
import { glideConfig } from '../glide';
import { useRegularTransfer } from './useRegularTransfer';
import { useSafeTransfer } from './useSafeTransfer';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { Address, Hash } from 'viem';

export const usePayflowTransaction = (isNativeFlow: boolean) => {
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: signer } = useWalletClient();
  const client = useClient();
  const { profile } = useContext(ProfileContext);

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

  useEffect(() => {
    const transferStatus = isNativeFlow
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

    setPaymentTxStatus({
      isPending: transferStatus.isPending || glideStatus.isPending,
      isConfirmed: transferStatus.isConfirmed && glideStatus.isConfirmed,
      error: transferStatus.error || glideStatus.error,
      txHash: glideStatus.txHash || transferStatus.txHash || null,
      status: transferStatus.isConfirmed ? glideStatus.status : transferStatus.status || 'Loading'
    });
  }, [
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
    glideStatus
  ]);

  const handleGlideTransaction = async ({
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
    console.debug('Payment in handleGlideTransaction: ', payment);

    if (!profile || !client || !signer) {
      return { success: false };
    }

    if (isNativeFlow) {
      resetSafe();
    } else {
      resetRegular();
    }

    setGlideStatus({
      isPending: true,
      isConfirmed: false,
      error: false,
      txHash: null,
      status: 'Fulfilling'
    });

    try {
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

          let txHash;
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

            txHash = await transfer(
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
            );
          } else {
            txHash = (await sendTransactionAsync(tx)) as Hash;
          }

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
        payment.hash = glideTxHash;
        updatePayment(payment);

        setGlideStatus({
          isPending: false,
          isConfirmed: true,
          error: false,
          txHash: glideTxHash,
          status: 'Fulfilled'
        });

        return { success: true, txHash: glideTxHash };
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
        status: 'Failed'
      });
      return { success: false };
    }
  };

  return { handleGlideTransaction, paymentTxStatus };
};
