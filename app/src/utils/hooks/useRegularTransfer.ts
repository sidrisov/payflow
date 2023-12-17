import { useMemo, useState } from 'react';
import { Address, Chain, Hash } from 'viem';

import { usePrepareSendTransaction, useSendTransaction, useWaitForTransaction } from 'wagmi';

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
  sendTransaction: any;
  reset: () => void;
} => {
  const [status, setStatus] = useState<string>();

  const { config } = usePrepareSendTransaction({
    enabled: tx.to !== undefined,
    to: tx.to,
    value: tx.amount
  });

  const {
    isLoading: isSendTxLoading,
    isSuccess: isSendTxSuccess,
    isError: isSendTxError,
    error: sendError,
    data: sendTxHash,
    sendTransaction,
    reset
  } = useSendTransaction(config);

  const {
    isLoading: isTxConfirmationLoading,
    isSuccess: isTxConfirmed,
    isError: isTxConfirmationError
  } = useWaitForTransaction({
    hash: sendTxHash?.hash
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
    txHash: sendTxHash?.hash,
    sendTransaction,
    reset
  };
};
