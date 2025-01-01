import { useCallback, useState } from 'react';
import { Account, Address, Chain, Hash, Hex, PublicClient, Transport, WalletClient } from 'viem';
import { SAFE_CONSTANTS, sendTransaction } from '@payflow/common';

export type ViemTransaction = {
  from: Address;
  to: Address;
  data?: Hex;
  value?: bigint;
};

export const useSafeTransfer = (): {
  loading: boolean;
  confirmed: boolean | undefined;
  error: boolean;
  status: string | undefined;
  txHash: Hash | undefined;
  transfer: (
    client: PublicClient<Transport, Chain>,
    signer: WalletClient<Transport, Chain, Account>,
    tx: ViemTransaction,
    safeOwners: Address[],
    safeVersion: string,
    saltNonce: string,
    entryPointVersion: '0.6' | '0.7'
  ) => Promise<Hash | undefined>;
  reset: () => void;
} => {
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>();
  const [error, setError] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<Hash>();
  const [status, setStatus] = useState<string>();

  const transfer = useCallback(async function (
    client: PublicClient<Transport, Chain>,
    signer: WalletClient<Transport, Chain, Account>,
    tx: ViemTransaction,
    safeOwners: Address[],
    safeVersion: string,
    saltNonce: string,
    entryPointVersion: '0.6' | '0.7' = '0.6'
  ): Promise<Hash | undefined> {
    setLoading(true);

    try {
      if (safeVersion === SAFE_CONSTANTS.SAFE_SMART_ACCOUNT_VERSION) {
        const txHash = await sendTransaction(
          client,
          signer,
          [
            {
              to: tx.to,
              data: tx.data,
              value: tx.value
            }
          ],
          tx.from,
          safeOwners,
          saltNonce,
          {
            entryPointVersion,
            sponsoredTx: true,
            onStatus: setStatus
          }
        );

        setTxHash(txHash);

        if (txHash) {
          setConfirmed(true);
        }

        return txHash;
      } else {
        setStatus('Not supported');
        setError(true);
        return;
      }
    } catch (error) {
      setConfirmed(false);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(async function () {
    setLoading(false);
    setError(false);
    setConfirmed(undefined);
    setTxHash(undefined);
    setStatus(undefined);
  }, []);

  return { loading, confirmed, error, status, txHash, transfer, reset };
};
