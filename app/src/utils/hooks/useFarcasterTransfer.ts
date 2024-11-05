import { useState, useCallback, useEffect } from 'react';
import { Hash, erc20Abi } from 'viem';
import { v4 as uuid } from 'uuid';
import {
  RequestWalletActionMessage,
  EthSendTransactionAction,
  TransactionResponse
} from '../farcaster';
import { useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'react-toastify';

export const useFarcasterTransfer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [status, setStatus] = useState<string>();

  const {
    isLoading: isTxConfirmationLoading,
    isSuccess: isTxConfirmed,
    isError: isTxConfirmationError
  } = useWaitForTransactionReceipt({
    hash: txHash || undefined
  });

  useEffect(() => {
    if (isTxConfirmationLoading) {
      setStatus('confirming');
    } else if (error) {
      if (error.includes('rejected')) {
        setStatus('rejected');
      } else {
        setStatus('failed');
      }
    } else if (loading) {
      setStatus('signing');
    } else if (txHash) {
      setStatus('submitted');
    } else if (isTxConfirmed) {
      setStatus('confirmed');
    } else {
      setStatus(undefined);
    }
  }, [isTxConfirmationLoading, loading, error, txHash, isTxConfirmed]);

  const sendTransactionAsync = useCallback(async (tx: any): Promise<Hash> => {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Validate chain is set
      if (!tx.chainId) {
        throw new Error('Chain ID is required for Farcaster transactions');
      }

      const message: RequestWalletActionMessage = {
        jsonrpc: '2.0',
        id: uuid(),
        method: 'fc_requestWalletAction',
        params: {
          action: {
            chainId: `eip155:${tx.chainId}`,
            method: 'eth_sendTransaction',
            attribution: false,
            params: {
              ...(tx.value && tx.value !== 0n
                ? {
                    abi: [],
                    to: tx.to,
                    value: tx.value.toString()
                  }
                : {
                    abi: erc20Abi,
                    to: tx.to,
                    data: tx.data
                  })
            }
          } as EthSendTransactionAction
        }
      };

      console.log('posting tx message: ', message);

      // Send message to parent frame (Warpcast)
      window.parent.postMessage(message, '*');

      // Create promise to wait for response
      const hash: Hash = await new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent<TransactionResponse>) => {
          console.log('Received message: ', event);

          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

          // Check if this is a JSON-RPC response matching our request
          if (data.jsonrpc === '2.0' && data.id === message.id && !('params' in data)) {
            /*             if (event.source === window || event.origin === window.location.origin) {
              console.log('Ignoring message from our own window');
              return;
            } */

            window.removeEventListener('message', handleMessage);

            if ('error' in data) {
              reject(new Error(data.error.message || 'Transaction failed'));
            } else if ('result' in data && 'transactionHash' in data.result) {
              resolve(data.result.transactionHash as Hash);
            } else {
              reject(new Error('Invalid transaction response'));
            }
          }
        };

        window.addEventListener('message', handleMessage);

        // Timeout after 3 minutes
        setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          reject(new Error('Transaction request timed out'));
        }, 3 * 60 * 1000);
      });

      setTxHash(hash);
      return hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setTxHash(null);
  }, []);

  return {
    sendTransactionAsync,
    loading: loading || isTxConfirmationLoading,
    confirmed: isTxConfirmed,
    error: error !== null || isTxConfirmationError,
    status,
    txHash,
    reset
  };
};
