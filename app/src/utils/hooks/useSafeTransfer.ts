import { useCallback, useMemo, useState } from 'react';
import { Address, Chain, Hash, TransactionReceipt } from 'viem';
import { safeTransferEthWithDeploy } from '../safeTransactions';

import { providers } from 'ethers';
import { SafeAccountConfig } from '@safe-global/protocol-kit';
import { SafeVersion } from '@safe-global/safe-core-sdk-types';
import { usePublicClient } from 'wagmi';

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
    ethersSigner: providers.JsonRpcSigner,
    tx: { from: Address; to: Address; amount: bigint; safeSigner?: Address },
    safeAccountConfig: SafeAccountConfig,
    safeVersion: SafeVersion,
    saltNonce: string
  ) => Promise<void>;
  reset: () => Promise<void>;
} => {
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>();
  const [error, setError] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<Hash>();
  const [status, setStatus] = useState<string>();

  const publicClient = usePublicClient();

  useMemo(async () => {
    if (txHash) {
      setStatus('confirming');
      try {
        const receipt = (await publicClient.waitForTransactionReceipt({
          hash: txHash
        })) as TransactionReceipt;

        if (receipt && receipt.status === 'success') {
          setConfirmed(true);
        }
      } catch (error) {
        console.log(error);
        setError(true);
      }
    }
  }, [txHash]);

  const statusCallback = (status: string | undefined): void => {
    setStatus(status);
  };

  const transfer = useCallback(async function (
    ethersSigner: providers.JsonRpcSigner,
    tx: { from: Address; to: Address; amount: bigint; safeSigner?: Address },
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
      if (message.includes('ACTION_REJECTED')) {
        setStatus('rejected');
      }
      console.log(error);
      setConfirmed(false);
      setError(true);
    } finally {
      setLoading(false);
    }
  },
  []);

  const reset = useCallback(async function () {
    setLoading(true);
    setError(false);
    setConfirmed(undefined);
    setTxHash(undefined);
    setStatus(undefined);
  }, []);
  return { loading, confirmed, error, status, txHash, transfer, reset };
};
