import { useCallback, useMemo, useState } from 'react';
import { Address, Chain, Hash } from 'viem';
import { safeTransferEthWithDeploy } from '../safeTransactions';

import { JsonRpcSigner } from 'ethers';
import { SafeAccountConfig } from '@safe-global/protocol-kit';
import { SafeVersion } from '@safe-global/safe-core-sdk-types';
import { useWaitForTransactionReceipt } from 'wagmi';
import { Token } from '../erc20contracts';

export type SafeWallet = {
  chain: Chain;
  address: Address;
};

export const useSafeTransfer = (): {
  loading: boolean;
  confirmed: boolean | undefined;
  error: boolean;
  status: string | undefined;
  txHash: Hash | undefined;
  transfer: (
    ethersSigner: JsonRpcSigner,
    tx: { from: Address; to: Address; amount: bigint; safeSigner?: Address },
    safeAccountConfig: SafeAccountConfig,
    safeVersion: SafeVersion,
    saltNonce: string
  ) => Promise<void>;
  reset: () => void;
} => {
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>();
  const [error, setError] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<Hash>();
  const [status, setStatus] = useState<string>();

  const {
    isSuccess: isTxConfirmed,
    isLoading: isTxLoading,
    isError: isTxError
  } = useWaitForTransactionReceipt({
    hash: txHash
  });

  useMemo(async () => {
    if (isTxLoading) {
      setStatus('confirming');
      return;
    }

    if (isTxConfirmed) {
      setConfirmed(true);
      return;
    }

    if (isTxError) {
      setError(true);
      return;
    }
  }, [isTxLoading, isTxConfirmed, isTxError]);

  const statusCallback = (status: string | undefined): void => {
    setStatus(status);
  };

  const transfer = useCallback(async function (
    ethersSigner: JsonRpcSigner,
    tx: { from: Address; to: Address; amount: bigint; token?: Token; safeSigner?: Address },
    safeAccountConfig: SafeAccountConfig,
    safeVersion: SafeVersion,
    saltNonce: string
  ) {
    setLoading(true);
    try {
      const txHash = await safeTransferEthWithDeploy(
        ethersSigner,
        tx,
        safeAccountConfig,
        safeVersion,
        saltNonce,
        statusCallback
      );
      setTxHash(txHash);
    } catch (error) {
      const message = (error as Error).message;

      console.debug(message);
      if (message.includes('ACTION_REJECTED')) {
        setStatus('rejected');
      }
      if (message.includes('Insufficient Fees')) {
        setStatus('insufficient_fees');
      }

      console.error(error);
      setConfirmed(false);
      setError(true);
    } finally {
      setLoading(false);
    }
  },
  []);

  const reset = useCallback(async function () {
    setLoading(false);
    setError(false);
    setConfirmed(undefined);
    setTxHash(undefined);
    setStatus(undefined);
  }, []);
  return { loading, confirmed, error, status, txHash, transfer, reset };
};
