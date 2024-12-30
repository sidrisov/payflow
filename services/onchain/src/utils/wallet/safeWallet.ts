import {
  Address,
  Chain,
  Hash,
  Transport,
  Account,
  WalletClient,
  keccak256,
  toBytes,
  LocalAccount,
  Hex,
  PublicClient,
  OneOf,
  EIP1193Provider
} from 'viem';
import {
  erc7579Actions,
  isModuleInstalled
} from 'permissionless/actions/erc7579';
import {
  isSmartAccountDeployed,
  createSmartAccountClient
} from 'permissionless';
import {
  entryPoint06Address,
  entryPoint07Address,
  getUserOperationHash,
  UserOperationCall
} from 'viem/account-abstraction';
import { SAFE_CONSTANTS } from '@payflow/common';
import {
  RHINESTONE_ATTESTER_ADDRESS,
  getAccount,
  encodeSmartSessionSignature,
  getOwnableValidatorMockSignature,
  encodeValidatorNonce,
  SmartSessionMode,
  getEnableSessionsAction,
  getRemoveSessionAction,
  getSmartSessionsValidator,
  Session
} from '@rhinestone/module-sdk';

import { toSafeSmartAccount } from '../permissionless/toSafeSmartAccount';
import {
  pimlicoClient,
  pimlicoSponsorshipPolicyIds,
  transport
} from '../paymaster/pimlico';

import { wagmiConfig } from '../wagmi';
import { getClient } from '@wagmi/core/actions';
import { getAccountNonce } from 'permissionless/actions';

export async function generateWallet(
  owners: Address[],
  nonce: string,
  chainIds: number[]
): Promise<any[]> {
  const deployPromises = chainIds.map(async (chainId) => {
    const client = getClient(wagmiConfig, { chainId: chainId as any });

    if (client) {
      const safeAccount = await toSafeSmartAccount({
        client,
        entryPoint: {
          address:
            SAFE_CONSTANTS.AA_ENTRY_POINT_VERSION === '0.7'
              ? entryPoint07Address
              : entryPoint06Address,
          version: SAFE_CONSTANTS.AA_ENTRY_POINT_VERSION
        },
        version: SAFE_CONSTANTS.SAFE_SMART_ACCOUNT_VERSION,
        saltNonce: BigInt(keccak256(toBytes(nonce))),
        owners: owners.map((owner) => ({
          type: 'local',
          address: owner
        })) as [LocalAccount],
        safe4337ModuleAddress: SAFE_CONSTANTS.SAFE_4337_MODULE,
        erc7579LaunchpadAddress: SAFE_CONSTANTS.SAFE_ERC7579_LAUNCHPAD,
        attesters: [RHINESTONE_ATTESTER_ADDRESS],
        attestersThreshold: 1
      });

      const predictedAddress = safeAccount.address;
      const isSafeDeployed = await isSmartAccountDeployed(
        client,
        predictedAddress
      );

      console.log(predictedAddress, chainId, isSafeDeployed);

      return {
        network: chainId,
        address: predictedAddress,
        deployed: isSafeDeployed,
        version:
          SAFE_CONSTANTS.SAFE_SMART_ACCOUNT_VERSION +
          '_' +
          SAFE_CONSTANTS.AA_ENTRY_POINT_VERSION
      };
    } else {
      throw Error('Empty client');
    }
  });

  return Promise.all(deployPromises);
}

export async function sendTransaction(
  client: PublicClient<Transport, Chain>,
  signer: WalletClient<Transport, Chain, Account> | LocalAccount,
  calls: UserOperationCall[],
  walletAddress: Address,
  owners: Address[],
  saltNonce: string,
  options?: {
    entryPointVersion?: '0.6' | '0.7';
    sponsoredTx?: boolean;
    onStatus?: (status: string) => void;
  }
): Promise<Hash> {
  const {
    entryPointVersion = '0.7',
    sponsoredTx = false,
    onStatus
  } = options ?? {};

  try {
    onStatus?.('preparing');

    const safeAccount = await toSafeSmartAccount({
      address: walletAddress,
      client,
      entryPoint: {
        address:
          entryPointVersion === '0.6'
            ? entryPoint06Address
            : entryPoint07Address,
        version: entryPointVersion
      },
      version: SAFE_CONSTANTS.SAFE_SMART_ACCOUNT_VERSION,
      saltNonce: BigInt(keccak256(toBytes(saltNonce))),
      owners: owners.map((owner) => {
        if ('type' in signer && signer.type === 'local') {
          return signer;
        } else if (
          (
            signer as WalletClient<Transport, Chain, Account>
          ).account.address.toLowerCase() === owner.toLowerCase()
        ) {
          return signer;
        } else {
          return {
            type: 'local',
            address: owner
          } as LocalAccount;
        }
      }) as [
        OneOf<
          | EIP1193Provider
          | WalletClient<Transport, Chain | undefined, Account>
          | LocalAccount
        >
      ],
      ...(entryPointVersion === '0.7' && {
        safe4337ModuleAddress: SAFE_CONSTANTS.SAFE_4337_MODULE,
        erc7579LaunchpadAddress: SAFE_CONSTANTS.SAFE_ERC7579_LAUNCHPAD,
        attesters: [RHINESTONE_ATTESTER_ADDRESS],
        attestersThreshold: 1
      })
    });

    const chain = client.chain;
    const paymaster = pimlicoClient(chain.id, entryPointVersion);

    // Create Smart Account Client
    const smartAccountClient = createSmartAccountClient({
      account: safeAccount,
      chain,
      bundlerTransport: transport(chain.id),
      paymaster,
      ...(sponsoredTx && {
        paymasterContext: {
          sponsorshipPolicyId: pimlicoSponsorshipPolicyIds(chain.id)?.[0]
        }
      }),
      userOperation: {
        estimateFeesPerGas: async () => {
          return (await paymaster.getUserOperationGasPrice()).fast;
        }
      }
    }).extend(erc7579Actions());

    onStatus?.('signing');

    const userOpHash = await smartAccountClient.sendUserOperation({
      calls
    });

    onStatus?.('submitted');

    const userOpReceipt = await pimlicoClient(
      chain.id
    ).waitForUserOperationReceipt({
      hash: userOpHash
    });

    console.log('userOpReceipt', userOpReceipt);

    onStatus?.('submitted');

    return userOpReceipt.receipt.transactionHash;
  } catch (error) {
    const message = (error as Error).message.toLowerCase();
    let status: string = 'failed';

    switch (true) {
      case message.includes('action_rejected'):
        status = 'rejected';
        break;
      case message.includes('sponsorshippolicy'):
        status = 'sponsorship_failed';
        break;
      case message.includes('insufficient fees'):
        status = 'insufficient_fees';
        break;
      case message.includes('reverted'):
        status = 'reverted';
        break;
    }

    console.error('error', error);

    onStatus?.(status);
    throw error;
  }
}

export async function sendTransactionWithSession(
  client: PublicClient<Transport, Chain>,
  safeAddress: Address,
  session: {
    sessionId: Hex;
    sessionKey: LocalAccount;
  },
  calls: UserOperationCall[],
  options?: {
    sponsoredTx?: boolean;
    onStatus?: (status: string) => void;
  }
): Promise<Hash> {
  const { sponsoredTx = false, onStatus } = options ?? {};

  try {
    onStatus?.('preparing');

    // Create Safe Account instance
    const safeAccount = await toSafeSmartAccount({
      address: safeAddress,
      client,
      entryPoint: {
        address: entryPoint07Address,
        version: '0.7'
      },
      version: SAFE_CONSTANTS.SAFE_SMART_ACCOUNT_VERSION,
      owners: [] as any,
      safe4337ModuleAddress: SAFE_CONSTANTS.SAFE_4337_MODULE,
      erc7579LaunchpadAddress: SAFE_CONSTANTS.SAFE_ERC7579_LAUNCHPAD,
      attesters: [RHINESTONE_ATTESTER_ADDRESS],
      attestersThreshold: 1
    });

    const chain = client.chain;
    const paymaster = pimlicoClient(chain.id, '0.7');

    // Create Smart Account Client
    const smartAccountClient = createSmartAccountClient({
      account: safeAccount,
      chain,
      bundlerTransport: transport(chain.id),
      paymaster,
      ...(sponsoredTx && {
        paymasterContext: {
          sponsorshipPolicyId: pimlicoSponsorshipPolicyIds(chain.id)?.[0]
        }
      }),
      userOperation: {
        estimateFeesPerGas: async () => {
          return (await paymaster.getUserOperationGasPrice()).fast;
        }
      }
    }).extend(erc7579Actions());

    onStatus?.('signing');

    const accountNonce = await getAccountNonce(client, {
      address: safeAccount.address,
      entryPointAddress: entryPoint07Address,
      key: encodeValidatorNonce({
        account: getAccount({
          address: safeAccount.address,
          type: 'safe'
        }),
        validator: getSmartSessionsValidator({
          useRegistry: false,
          sessions: []
        })
      })
    });

    const sessionDetails = {
      mode: SmartSessionMode.USE,
      permissionId: session.sessionId,
      signature: getOwnableValidatorMockSignature({
        threshold: 1
      })
    };

    const userOperation = await smartAccountClient.prepareUserOperation({
      account: safeAccount,
      calls,
      nonce: accountNonce,
      signature: encodeSmartSessionSignature(sessionDetails)
    });

    const userOpHashToSign = getUserOperationHash({
      chainId: chain.id,
      entryPointAddress: entryPoint07Address,
      entryPointVersion: '0.7',
      userOperation
    });

    console.log('userOpHashToSign', userOpHashToSign);

    sessionDetails.signature = await session.sessionKey.signMessage({
      message: { raw: userOpHashToSign }
    });

    userOperation.signature = encodeSmartSessionSignature(sessionDetails);

    const signedUserOpHash = getUserOperationHash({
      chainId: chain.id,
      entryPointAddress: entryPoint07Address,
      entryPointVersion: '0.7',
      userOperation
    });

    console.log('signedUserOpHash', signedUserOpHash);

    console.log('userOperation', userOperation);
    const userOpHash = await smartAccountClient.sendUserOperation(
      userOperation as any
    );

    console.log('userOpHash', userOpHash);

    const userOpReceipt = await pimlicoClient(
      chain.id
    ).waitForUserOperationReceipt({
      hash: userOpHash
    });

    console.log('userOpReceipt', userOpReceipt);

    onStatus?.('submitted');

    return userOpReceipt.receipt.transactionHash;
  } catch (error) {
    const message = (error as Error).message.toLowerCase();
    let status: string = 'failed';

    switch (true) {
      case message.includes('action_rejected'):
        status = 'rejected';
        break;
      case message.includes('sponsorshippolicy'):
        status = 'sponsorship_failed';
        break;
      case message.includes('insufficient fees'):
        status = 'insufficient_fees';
        break;
      case message.includes('reverted'):
        status = 'reverted';
        break;
    }

    console.error('error', error);

    onStatus?.(status);
    throw error;
  }
}

export async function manageSessions(
  client: PublicClient<Transport, Chain>,
  signer: WalletClient<Transport, Chain, Account> | LocalAccount,
  safeAddress: Address,
  owners: Address[],
  nonce: string,
  enableSessions: Session[],
  removeSessionIds: Hex[],
  options?: {
    sponsoredTx?: boolean;
  }
): Promise<Hash | null> {
  const { sponsoredTx = false } = options ?? {};

  try {
    const safeAccount = await toSafeSmartAccount({
      address: safeAddress,
      client,
      entryPoint: {
        address: entryPoint07Address,
        version: '0.7'
      },
      version: SAFE_CONSTANTS.SAFE_SMART_ACCOUNT_VERSION,
      saltNonce: BigInt(keccak256(toBytes(nonce))),
      owners: owners.map((owner) => {
        if ('type' in signer && signer.type === 'local') {
          return signer;
        } else if (
          (
            signer as WalletClient<Transport, Chain, Account>
          ).account.address.toLowerCase() === owner.toLowerCase()
        ) {
          return signer;
        } else {
          return {
            type: 'local',
            address: owner
          };
        }
      }) as any,
      safe4337ModuleAddress: SAFE_CONSTANTS.SAFE_4337_MODULE,
      erc7579LaunchpadAddress: SAFE_CONSTANTS.SAFE_ERC7579_LAUNCHPAD,
      attesters: [RHINESTONE_ATTESTER_ADDRESS],
      attestersThreshold: 1
    });

    const chain = client.chain;
    const paymaster = pimlicoClient(chain.id, '0.7');

    const smartAccountClient = createSmartAccountClient({
      account: safeAccount,
      chain,
      bundlerTransport: transport(chain.id),
      paymaster,
      ...(sponsoredTx && {
        paymasterContext: {
          sponsorshipPolicyId: pimlicoSponsorshipPolicyIds(chain.id)?.[0]
        }
      }),
      userOperation: {
        estimateFeesPerGas: async () => {
          return (await paymaster.getUserOperationGasPrice()).fast;
        }
      }
    }).extend(erc7579Actions());

    const isDeployed = await isSmartAccountDeployed(
      client,
      safeAccount.address
    );

    const isInstalled =
      isDeployed &&
      (await isModuleInstalled(
        smartAccountClient,
        getSmartSessionsValidator({
          useRegistry: false,
          sessions: []
        })
      ));

    console.log(
      `Safe Account: ${safeAccount.address}
      isDeployed: ${isDeployed}
      isSessionModuleInstalled: ${isInstalled}`
    );

    let userOpHash: Hash | null = null;

    if (!isInstalled) {
      const smartSessions = getSmartSessionsValidator({
        useRegistry: false,
        sessions: enableSessions ?? []
      });

      userOpHash = await smartAccountClient.installModule(smartSessions);
    } else if (enableSessions && enableSessions.length > 0) {
      const calls: UserOperationCall[] = [];

      if (enableSessions && enableSessions.length > 0) {
        const enableSessionAction = getEnableSessionsAction({
          sessions: enableSessions
        });
        calls.push({
          to: enableSessionAction.to,
          data: enableSessionAction.data,
          value: BigInt(enableSessionAction.value.toString())
        });
      }

      // Add remove actions for each session
      for (const sessionId of removeSessionIds) {
        const removeAction = getRemoveSessionAction({
          permissionId: sessionId
        });
        calls.push({
          to: removeAction.to,
          data: removeAction.data,
          value: BigInt(removeAction.value.toString())
        });
      }

      userOpHash = await smartAccountClient.sendUserOperation({
        calls
      });
    }

    let txHash: Hash | null = null;
    if (userOpHash) {
      const receipt = await pimlicoClient(chain.id).waitForUserOperationReceipt(
        {
          hash: userOpHash
        }
      );

      txHash = receipt.receipt.transactionHash;
    }

    console.log('Session updated tx hash:', txHash);

    return txHash;
  } catch (error) {
    console.error('error', error);
    throw error;
  }
}

export async function removeSessions(
  client: PublicClient<Transport, Chain>,
  signer: WalletClient<Transport, Chain, Account> | LocalAccount,
  safeAddress: Address,
  owners: Address[],
  nonce: string,
  sessionIds: Hex[],
  options?: {
    sponsoredTx?: boolean;
  }
): Promise<Hash | null> {
  const { sponsoredTx = false } = options ?? {};

  try {
    const safeAccount = await toSafeSmartAccount({
      address: safeAddress,
      client,
      entryPoint: {
        address: entryPoint07Address,
        version: '0.7'
      },
      version: SAFE_CONSTANTS.SAFE_SMART_ACCOUNT_VERSION,
      saltNonce: BigInt(keccak256(toBytes(nonce))),
      owners: owners.map((owner) => {
        if ('type' in signer && signer.type === 'local') {
          return signer;
        } else if (
          (
            signer as WalletClient<Transport, Chain, Account>
          ).account.address.toLowerCase() === owner.toLowerCase()
        ) {
          return signer;
        } else {
          return { type: 'local', address: owner };
        }
      }) as any,
      safe4337ModuleAddress: SAFE_CONSTANTS.SAFE_4337_MODULE,
      erc7579LaunchpadAddress: SAFE_CONSTANTS.SAFE_ERC7579_LAUNCHPAD,
      attesters: [RHINESTONE_ATTESTER_ADDRESS],
      attestersThreshold: 1
    });

    const chain = client.chain;
    const paymaster = pimlicoClient(chain.id, '0.7');

    const smartAccountClient = createSmartAccountClient({
      account: safeAccount,
      chain,
      bundlerTransport: transport(chain.id),
      paymaster,
      ...(sponsoredTx && {
        paymasterContext: {
          sponsorshipPolicyId: pimlicoSponsorshipPolicyIds(chain.id)?.[0]
        }
      }),
      userOperation: {
        estimateFeesPerGas: async () => {
          return (await paymaster.getUserOperationGasPrice()).fast;
        }
      }
    }).extend(erc7579Actions());

    if (sessionIds.length === 0) {
      return null;
    }

    const calls: UserOperationCall[] = [];

    // Add remove actions for each session
    for (const sessionId of sessionIds) {
      const removeAction = getRemoveSessionAction({
        permissionId: sessionId
      });
      calls.push({
        to: removeAction.to,
        data: removeAction.data,
        value: BigInt(removeAction.value.toString())
      });
    }

    const userOpHash = await smartAccountClient.sendUserOperation({ calls });
    const receipt = await pimlicoClient(chain.id).waitForUserOperationReceipt({
      hash: userOpHash
    });

    const txHash = receipt.receipt.transactionHash;
    console.log('Removed sessions tx hash:', txHash);
    return txHash;
  } catch (error) {
    console.error('error', error);
    throw error;
  }
}
