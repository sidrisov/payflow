import { useContext, useState, useEffect } from 'react';
import { useChainId, useSwitchChain, useWalletClient, useClient } from 'wagmi';
import { createSession, executeSession, PaymentOption } from '@paywithglide/glide-js';
import { ProfileContext } from '../../contexts/UserContext';
import { SafeAccountConfig } from '@safe-global/protocol-kit';
import { SafeVersion } from '@safe-global/safe-core-sdk-types';
import { updatePayment } from '../../services/payments';
import { PaymentTxStatus, PaymentType } from '../../types/PaymentType';
import { glideConfig } from '../glide';
import { useRegularTransfer } from './useRegularTransfer';
import { useSafeTransfer } from './useSafeTransfer';
import { FlowType, FlowWalletType } from '../../types/FlowType';
import { Hash } from 'viem';

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

  useEffect(() => {
    if (isNativeFlow) {
      setPaymentTxStatus({
        isPending: Boolean(loadingSafe || (txHashSafe && !confirmedSafe && !errorSafe)),
        isConfirmed: Boolean(confirmedSafe),
        error: Boolean(errorSafe),
        txHash: txHashSafe ?? null,
        status: statusSafe ?? ''
      });
    } else {
      setPaymentTxStatus({
        isPending: Boolean(loadingRegular || (txHashRegular && !confirmedRegular && !errorRegular)),
        isConfirmed: Boolean(confirmedRegular),
        error: Boolean(errorRegular),
        txHash: txHashRegular ?? null,
        status: statusRegular ?? ''
      });
    }
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
    statusRegular
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
    if (!profile || !client || !signer) {
      return { success: false };
    }

    if (isNativeFlow) {
      resetSafe();
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

        let txHash;
        if (isNativeFlow) {
          // TODO: hard to figure out if there 2 signers or one, for now consider if signerProvider not specified - 1, otherwise - 2
          const owners = [];
          if (
            senderFlow.signerProvider &&
            senderFlow.signer.toLowerCase() !== profile.identity.toLowerCase()
          ) {
            owners.push(profile.identity);
          }
          owners.push(senderFlow.signer);

          const safeAccountConfig: SafeAccountConfig = {
            owners,
            threshold: 1
          };

          const saltNonce = senderFlow.saltNonce as string;
          const safeVersion = paymentWallet.version as SafeVersion;

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
      return { success: true, txHash: glideTxHash };
    } else {
      return { success: false };
    }
  };

  return { handleGlideTransaction, paymentTxStatus };
};
