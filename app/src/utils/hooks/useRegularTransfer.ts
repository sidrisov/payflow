import { useCallback, useMemo, useState } from 'react';
import { Address, Chain, Hash } from 'viem';

import { Config, useSendTransaction, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { SendTransactionMutate, WriteContractMutate } from 'wagmi/query';

export type SafeWallet = {
  chain: Chain;
  address: Address;
};

export const useRegularTransfer = (): {
  loading: boolean;
  confirmed: boolean | undefined;
  error: boolean;
  status: string | undefined;
  txHash: Hash | undefined;
  sendTransaction: SendTransactionMutate<Config, unknown>;
  writeContract: WriteContractMutate<Config, unknown>;
  reset: () => void;
} => {
  const [status, setStatus] = useState<string>();

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
    isPending: isSendErc20TxLoading,
    isSuccess: isSendErc20TxSuccess,
    isError: isSendErc20TxError,
    error: sendErc20Error,
    data: sendErc20TxHash,
    writeContract,
    reset: erc20Reset
  } = useWriteContract();

  const {
    isLoading: isTxConfirmationLoading,
    isSuccess: isTxConfirmed,
    isError: isTxConfirmationError
  } = useWaitForTransactionReceipt({
    hash: sendTxHash ? sendTxHash : sendErc20TxHash
  });

  useMemo(async () => {
    if (isTxConfirmationLoading) {
      setStatus('confirming');
      return;
    }

    if (isSendTxError || isSendErc20TxError) {
      if (sendError?.message.includes('rejected') || sendErc20Error?.message.includes('rejected')) {
        setStatus('rejected');
        return;
      }
    }

    if (isSendTxLoading || isSendErc20TxLoading) {
      setStatus('signing');
    } else if (isSendTxSuccess || isSendErc20TxSuccess) {
      setStatus('submitted');
    } else {
      setStatus(undefined);
    }
  }, [
    isSendTxLoading,
    isSendErc20TxLoading,
    isSendTxSuccess,
    isSendErc20TxSuccess,
    isSendTxError,
    isSendErc20TxError,
    isTxConfirmationLoading,
    sendError,
    sendErc20Error
  ]);

  const resetTransfer = useCallback(async function () {
    reset();
    erc20Reset();
  }, []);

  return {
    loading: isSendTxLoading || isSendErc20TxLoading || isTxConfirmationLoading,
    confirmed: isTxConfirmed,
    error: isSendTxError || isTxConfirmationError,
    status: status,
    txHash: sendTxHash,
    sendTransaction,
    writeContract,
    reset: resetTransfer
  };
};
