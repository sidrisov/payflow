import { useEffect, useState } from 'react';
import { Hash } from 'viem';

import { Config, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { SendTransactionMutateAsync } from 'wagmi/query';

export const useRegularTransfer = (): {
  loading: boolean;
  confirmed: boolean | undefined;
  error: boolean;
  status: string | undefined;
  txHash: Hash | undefined;
  sendTransactionAsync: SendTransactionMutateAsync<Config, unknown>;
  reset: () => void;
} => {
  const [status, setStatus] = useState<string>();

  const {
    isPending: isTxLoading,
    isSuccess: isTxSuccess,
    isError: isTxError,
    error: txError,
    data: txHash,
    sendTransactionAsync,
    reset
  } = useSendTransaction();

  const {
    isLoading: isTxConfirmationLoading,
    isSuccess: isTxConfirmed,
    isError: isTxConfirmationError
  } = useWaitForTransactionReceipt({
    hash: txHash
  });

  useEffect(() => {
    if (isTxConfirmationLoading) {
      setStatus('confirming');
    } else if (isTxError) {
      if (txError?.message.includes('rejected')) {
        setStatus('rejected');
      }
    } else if (isTxLoading) {
      setStatus('signing');
    } else if (isTxSuccess) {
      setStatus('submitted');
    } else {
      setStatus(undefined);
    }
  }, [isTxLoading, isTxSuccess, isTxError, isTxConfirmationLoading, txError]);

  return {
    loading: isTxLoading || isTxConfirmationLoading,
    confirmed: isTxConfirmed,
    error: isTxError || isTxConfirmationError,
    status,
    txHash,
    sendTransactionAsync,
    reset
  };
};
