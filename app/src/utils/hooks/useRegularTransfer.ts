import { useMemo, useState } from 'react';
import { Address, Chain, Hash } from 'viem';

import { Config, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { estimateGas } from 'wagmi/actions';
import { SendTransactionMutate } from 'wagmi/query';
import { wagmiConfig } from '../wagmiConfig';

export type SafeWallet = {
  chain: Chain;
  address: Address;
};

export const useRegularTransfer = (tx: {
  to: Address | undefined;
  amount: bigint | undefined;
}): {
  loading: boolean;
  confirmed: boolean | undefined;
  error: boolean;
  status: string | undefined;
  txHash: Hash | undefined;
  sendTransaction: SendTransactionMutate<Config, unknown>;
  reset: () => void;
} => {
  const [status, setStatus] = useState<string>();

  const result = estimateGas(wagmiConfig, {
    to: tx.to,
    value: tx.amount
  });

  const {
    isPending: isSendTxLoading,
    isSuccess: isSendTxSuccess,
    isError: isSendTxError,
    error: sendError,
    data: sendTxHash,
    sendTransaction,
    reset
  } = useSendTransaction();

  const {
    isLoading: isTxConfirmationLoading,
    isSuccess: isTxConfirmed,
    isError: isTxConfirmationError
  } = useWaitForTransactionReceipt({
    hash: sendTxHash
  });

  useMemo(async () => {
    if (isTxConfirmationLoading) {
      setStatus('confirming');
      return;
    }

    if (isSendTxError) {
      if (sendError?.message.includes('rejected')) {
        setStatus('rejected');
        return;
      }
    }

    if (isSendTxLoading) {
      setStatus('signing');
    } else if (isSendTxSuccess) {
      setStatus('submitted');
    } else {
      setStatus(undefined);
    }
  }, [isSendTxLoading, isSendTxSuccess, isSendTxError, isTxConfirmationLoading, sendError]);

  return {
    loading: isSendTxLoading || isTxConfirmationLoading,
    confirmed: isTxConfirmed,
    error: isSendTxError || isTxConfirmationError,
    status: status,
    txHash: sendTxHash,
    sendTransaction,
    reset
  };
};
