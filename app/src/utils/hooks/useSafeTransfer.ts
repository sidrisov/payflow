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
  isSmartAccountDeployed,
  ENTRYPOINT_ADDRESS_V06
} from 'permissionless';
import {
  paymasterClient,
  bundlerClient,
  transport,
  PIMLICO_SPONSORED_ENABLED,
  paymasterSponsorshipPolicyIds
} from '../pimlico';
import { signerToSafeSmartAccount } from '../signerToSafeSmartAccount';
import { PimlicoSponsorUserOperationParameters } from 'permissionless/actions/pimlico';
import { ENTRYPOINT_ADDRESS_V06_TYPE } from 'permissionless/types';

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
          entryPoint: ENTRYPOINT_ADDRESS_V06,
          signer: walletClientToSmartAccountSigner(signer),
          owners: safeAccountConfig.owners as Address[],
          threshold: safeAccountConfig.threshold,
          safeVersion: '1.4.1',
          saltNonce: BigInt(keccak256(toBytes(saltNonce))),
          address: tx.from
        });

        console.log(
          `Safe addresss: calculated with Pimlico - ${safeAccount.address} vs existing ${tx.from}`
        );

        const sponsorUserOperation = async (
          args: PimlicoSponsorUserOperationParameters<ENTRYPOINT_ADDRESS_V06_TYPE>
        ) => {
          const sponsorshipPolicyIds = paymasterSponsorshipPolicyIds(chain.id);
          console.log(
            `Available sponsorshipPolicyIds ${sponsorshipPolicyIds} for userOperation: `,
            args.userOperation
          );

          const validatedPoliciyIds = await paymasterClient(chain.id).validateSponsorshipPolicies({
            userOperation: args.userOperation,
            sponsorshipPolicyIds
          });

          console.log(
            `Can be sponsored by ${JSON.stringify(validatedPoliciyIds)} for userOperation: `,
            args.userOperation
          );

          if (validatedPoliciyIds.length === 0) {
            throw Error('Sponsorshipt not available');
          }

          // return first
          return paymasterClient(chain.id).sponsorUserOperation({
            ...args,
            sponsorshipPolicyId: validatedPoliciyIds[0].sponsorshipPolicyId
          });
        };

        const smartAccountClient = createSmartAccountClient({
          account: safeAccount,
          entryPoint: ENTRYPOINT_ADDRESS_V06,
          chain,
          bundlerTransport: transport(chain.id),
          middleware: {
            gasPrice: async () => {
              return (await bundlerClient(chain.id).getUserOperationGasPrice()).standard;
            },
            ...(PIMLICO_SPONSORED_ENABLED && {
              sponsorUserOperation
            })
          }
        });

        statusCallback?.('processing');

        const txHash = await smartAccountClient.sendTransaction(
          tx.token && tx.token !== ETH
            ? {
                to: tx.token.address,
                data: encodeFunctionData({
                  abi: erc20Abi,
                  functionName: 'transfer',
                  args: [tx.to, tx.amount]
                })
              }
            : {
                to: tx.to,
                value: tx.amount
              }
        );

        console.log('Tx hash: ', txHash, chain.name);

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

      const sponsoredPolicyErrorRegex = /Details: sponsorshipPolicy (.+)/g;
      const sponsoredPolicyErrorMatches = sponsoredPolicyErrorRegex.exec(message);
      if (sponsoredPolicyErrorMatches) {
        setStatus(`gas_sponsorship_failure:${sponsoredPolicyErrorMatches[1]}`);
      }

      if (message.includes('ACTION_REJECTED')) {
        setStatus('rejected');
      }
      if (message.includes('Insufficient Fees')) {
        setStatus('insufficient_fees');
      }

      console.error('Failed to send tx: ', error);
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
