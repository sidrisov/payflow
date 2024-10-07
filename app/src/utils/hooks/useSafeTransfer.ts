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

import { entryPoint06Address } from 'viem/account-abstraction';
import { toSafeSmartAccount } from '../pimlico/toSafeSmartAccount';
import { createSmartAccountClient, isSmartAccountDeployed } from 'permissionless';
import {
  paymasterSponsorshipPolicyIds as pimlicoSponsorshipPolicyIds,
  pimlicoClient,
  transport,
  PIMLICO_SPONSORED_ENABLED
} from '../pimlico/pimlico';

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

        console.debug('safe set up: ', safeAccountConfig, signer);

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
            // test test
            if (signer.account.address.toLowerCase() === owner.toLowerCase()) {
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
        const smartAccountClient = createSmartAccountClient({
          account: safeAccount,
          chain,
          bundlerTransport: transport(chain.id),
          paymaster: pimlicoClient(chain.id),
          ...(PIMLICO_SPONSORED_ENABLED && {
            paymasterContext: {
              sponsorshipPolicyId: sponsorshipPolicyIds?.[0]
            }
          }),
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
