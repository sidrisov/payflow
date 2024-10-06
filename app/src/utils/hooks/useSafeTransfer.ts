import { useCallback, useMemo, useState } from 'react';
import {
  Account,
  Address,
  Chain,
  Client,
  EIP1193Provider,
  Hash,
  Hex,
  LocalAccount,
  OneOf,
  Transport,
  WalletClient,
  keccak256,
  toBytes
} from 'viem';
import { useWaitForTransactionReceipt } from 'wagmi';

import { PimlicoSponsorUserOperationParameters } from 'permissionless/actions/pimlico';
import { entryPoint06Address, UserOperation } from 'viem/account-abstraction';
import { toSafeSmartAccount } from '../../utils/permissionless_forked/toSafeSmartAccount';
import { createSmartAccountClient, isSmartAccountDeployed } from 'permissionless';
import {
  paymasterSponsorshipPolicyIds as pimlicoSponsorshipPolicyIds,
  PIMLICO_SPONSORED_ENABLED,
  pimlicoClient,
  transport
} from '../pimlico';
import { delay } from '../delay';

export type ViemTransaction = {
  from: Address;
  to: Address;
  data?: Hex;
  value?: bigint;
};

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
    tx: ViemTransaction,
    safeAccountConfig: { owners: Address[]; threshold: number },
    safeVersion: string,
    saltNonce: string
  ) => Promise<Hash | undefined>;
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
    tx: ViemTransaction,
    safeAccountConfig: { owners: Address[]; threshold: number },
    safeVersion: string,
    saltNonce: string
  ): Promise<Hash | undefined> {
    setLoading(true);

    const isSafeDeployed = await isSmartAccountDeployed(client, tx.from);

    console.log('Tx: ', tx);

    try {
      console.log(
        `Safe transaction for: ${client.chain.name}:${tx.from} - ${safeVersion} - ${isSafeDeployed}`
      );

      // handle AA with pimlico, we only use to send tx once it was deployed
      if (safeVersion === '1.4.1') {
        const chain = signer.chain;

        const safeAccount = await toSafeSmartAccount({
          address: tx.from,
          client,
          entryPoint: {
            address: entryPoint06Address,
            version: '0.6'
          },
          version: '1.4.1',
          saltNonce: BigInt(keccak256(toBytes(saltNonce))),
          owners: safeAccountConfig.owners.map((owner) => {
            if (signer.account.address === owner) {
              return signer;
            } else {
              return {
                type: 'local',
                address: owner
              } as LocalAccount;
            }
          }) as [
            OneOf<
              EIP1193Provider | WalletClient<Transport, Chain | undefined, Account> | LocalAccount
            >
          ]
        });

        console.log(
          `Safe addresss: calculated with Pimlico - ${safeAccount.address} vs existing ${tx.from}`
        );

        const sponsorshipPolicyIds = pimlicoSponsorshipPolicyIds(chain.id);

        const sponsorUserOperation = async (args: PimlicoSponsorUserOperationParameters<'0.6'>) => {
          const sponsorshipPolicyIds = pimlicoSponsorshipPolicyIds(chain.id);
          console.log(
            `Available sponsorshipPolicyIds ${sponsorshipPolicyIds} for userOperation: `,
            args.userOperation
          );

          const validatedPoliciyIds = await pimlicoClient(chain.id).validateSponsorshipPolicies({
            userOperation: args.userOperation as UserOperation<'0.6'>,
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
          return pimlicoClient(chain.id).getPaymasterData({
            ...args,
            context: {
              sponsorshipPolicyId: validatedPoliciyIds[0].sponsorshipPolicyId
            }
          } as any);
        };

        const smartAccountClient = createSmartAccountClient({
          account: safeAccount,
          chain,
          bundlerTransport: transport(chain.id),
          paymaster: pimlicoClient(chain.id),
          paymasterContext: {
            sponsorshipPolicyId: sponsorshipPolicyIds?.[0]
          },
          /* paymasterContext: {
            ...(PIMLICO_SPONSORED_ENABLED && {
              sponsorUserOperation
            })
          }, */
          userOperation: {
            estimateFeesPerGas: async () => {
              return (await pimlicoClient(chain.id).getUserOperationGasPrice()).fast;
            }
          }
        });

        statusCallback?.('processing');

        const txHash = await smartAccountClient.sendTransaction({
          to: tx.to,
          data: tx.data,
          value: tx.value
        });

        console.log('Tx hash: ', txHash, chain.name);

        setTxHash(txHash);
        return txHash;
      } else {
        setStatus('Not supported');
        setError(true);
        return;
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
