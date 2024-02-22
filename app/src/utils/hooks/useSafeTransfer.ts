import { useCallback, useMemo, useState } from 'react';
import {
  Account,
  Address,
  Chain,
  Client,
  Hash,
  Transport,
  WalletClient,
  encodeFunctionData,
  erc20Abi,
  keccak256,
  toBytes
} from 'viem';
import { transferWithGelato } from '../safeTransactions';

import { SafeAccountConfig } from '@safe-global/protocol-kit';
import { SafeVersion } from '@safe-global/safe-core-sdk-types';
import { useWaitForTransactionReceipt } from 'wagmi';
import { ETH, Token } from '../erc20contracts';
import { clientToSigner } from './useEthersSigner';
import {
  walletClientToSmartAccountSigner,
  createSmartAccountClient,
  isSmartAccountDeployed
} from 'permissionless';
import { paymasterClient, bundlerClient, transport } from '../pimlico';
import { signerToSafeSmartAccount } from '../signerToSafeSmartAccount';

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
    client: Client<Transport, Chain>,
    signer: WalletClient<Transport, Chain, Account>,
    tx: { from: Address; to: Address; amount: bigint },
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
    client: Client<Transport, Chain>,
    signer: WalletClient<Transport, Chain, Account>,
    tx: { from: Address; to: Address; amount: bigint; token?: Token },
    safeAccountConfig: SafeAccountConfig,
    safeVersion: SafeVersion,
    saltNonce: string
  ) {
    setLoading(true);

    const isSafeDeployed = await isSmartAccountDeployed(client, tx.from);

    try {
      console.log(
        `Safe transaction for: ${client.chain.name}:${tx.from} - ${safeVersion} - ${isSafeDeployed}`
      );

      // handle AA with pimlico, we only use to send tx once it was deployed
      if (safeVersion === '1.4.1') {
        const chain = signer.chain;
        const safeAccount = await signerToSafeSmartAccount(client, {
          entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // global entrypoint
          signer: walletClientToSmartAccountSigner(signer),
          owners: safeAccountConfig.owners as Address[],
          threshold: safeAccountConfig.threshold,
          safeVersion: '1.4.1',
          saltNonce: BigInt(keccak256(toBytes(saltNonce)))
        });

        console.log(
          `Safe addresss: calculated with Pimlico - ${safeAccount.address} vs existing ${tx.from}`
        );

        const smartAccountClient = createSmartAccountClient({
          account: safeAccount,
          chain,
          transport: transport(chain.id),
          sponsorUserOperation: paymasterClient(chain.id).sponsorUserOperation
        });

        const gasPrices = await bundlerClient(chain.id).getUserOperationGasPrice();

        statusCallback?.('signing');

        const txHash = await smartAccountClient.sendTransaction(
          tx.token && tx.token !== ETH
            ? {
                to: tx.token.address,
                data: encodeFunctionData({
                  abi: erc20Abi,
                  functionName: 'transfer',
                  args: [tx.to, tx.amount]
                }),
                maxFeePerGas: gasPrices.fast.maxFeePerGas, // if using Pimlico
                maxPriorityFeePerGas: gasPrices.fast.maxPriorityFeePerGas // if using Pimlico
              }
            : {
                to: tx.to,
                value: tx.amount,
                maxFeePerGas: gasPrices.fast.maxFeePerGas, // if using Pimlico
                maxPriorityFeePerGas: gasPrices.fast.maxPriorityFeePerGas // if using Pimlico,
              }
        );

        setTxHash(txHash);
      } else {
        // handle with gelato relayer and safe sdk
        const txHash = await transferWithGelato(
          clientToSigner(signer),
          tx,
          isSafeDeployed,
          safeAccountConfig,
          safeVersion,
          saltNonce,
          statusCallback
        );
        setTxHash(txHash);
      }
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
