// attribution to Safe Developers, used those to write the logic
// https://github.com/safe-global/safe-wallet-web/blob/main/src/components/new-safe/create/logic/index.ts
// https://github.com/safe-global/safe-wallet-web/blob/main/src/services/contracts/safeContracts.ts
// https://github.com/safe-global/safe-wallet-web/blob/main/src/services/tx/relaying.ts
// https://github.com/safe-global/safe-core-sdk/blob/main/packages/protocol-kit/src/utils/signatures/utils.ts

import { ethers, providers } from 'ethers';
import {
  getFallbackHandlerDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment
} from '@safe-global/safe-deployments';

import Safe, {
  EthersAdapter,
  SafeAccountConfig,
  SafeDeploymentConfig,
  SafeFactory,
  getSafeContract
} from '@safe-global/protocol-kit';

import {
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType,
  SafeVersion
} from '@safe-global/safe-core-sdk-types';

import { RelayResponse } from '@gelatonetwork/relay-sdk';

import { Hash, Address } from 'viem';
import { toast } from 'react-toastify';
import { getRelayKitForChainId, isRelaySupported, waitForRelayTaskToComplete } from './relayer';
import { CUSTOM_CONTRACTS, CUSTOM_CONTRACTS_CHAINS } from './safeContracts';
import { signTransactionBySafe } from './safeSignatures';

const ZERO_ADDRESS = ethers.constants.AddressZero;
const LATEST_SAFE_VERSION = '1.3.0' as SafeVersion;
const GAS_LIMIT = 1_000_000;

// TODO: update to safeVersion: "1.4.1" (AA compatible once Safe deploys relevant contracts)
export async function safeDeploy({
  ethersSigner,
  safeAccountConfig,
  saltNonce,
  safeVersion = LATEST_SAFE_VERSION,
  initialize = true,
  sponsored = false,
  callback
}: {
  ethersSigner: providers.JsonRpcSigner | providers.JsonRpcProvider;
  safeAccountConfig: SafeAccountConfig;
  saltNonce: Hash;
  safeVersion?: SafeVersion;
  initialize?: boolean;
  sponsored?: boolean;
  callback?: (txHash: string | undefined) => void;
}): Promise<Address> {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: ethersSigner
  });

  const chainId = await ethAdapter.getChainId();

  const contractNetworks = CUSTOM_CONTRACTS_CHAINS.includes(chainId) ? CUSTOM_CONTRACTS : undefined;

  const safeFactory = await SafeFactory.create({
    ethAdapter,
    safeVersion,
    contractNetworks
  });

  const predictedAddress = await safeFactory.predictSafeAddress(safeAccountConfig, saltNonce);

  if (!initialize) {
    return predictedAddress as Address;
  }

  try {
    // deploy without relaying
    if (!sponsored || !isRelaySupported(chainId)) {
      const safe = await safeFactory.deploySafe({
        safeAccountConfig,
        saltNonce,
        callback
      });

      if (!safe) {
        throw new Error('Failed to deploy safe');
      }
    } else {
      const relayKit = getRelayKitForChainId(chainId);
      if (!relayKit) {
        throw new Error(`Relayer not supported for: ${chainId}`);
      }

      const readOnlyProxyFactoryContract = await ethAdapter.getSafeProxyFactoryContract({
        safeVersion,
        singletonDeployment: getProxyFactoryDeployment({
          network: chainId.toString(),
          version: safeVersion
        }),
        customContractAddress: CUSTOM_CONTRACTS_CHAINS.includes(chainId)
          ? CUSTOM_CONTRACTS[chainId].fallbackHandlerAddress
          : undefined
      });

      const proxyFactoryAddress = readOnlyProxyFactoryContract.getAddress();
      const readOnlyFallbackHandlerContract =
        await ethAdapter.getCompatibilityFallbackHandlerContract({
          safeVersion,
          singletonDeployment: getFallbackHandlerDeployment({
            network: chainId.toString(),
            version: safeVersion
          }),
          customContractAddress: CUSTOM_CONTRACTS_CHAINS.includes(chainId)
            ? CUSTOM_CONTRACTS[chainId].fallbackHandlerAddress
            : undefined
        });
      const fallbackHandlerAddress = readOnlyFallbackHandlerContract.getAddress();
      const readOnlySafeContract = await ethAdapter.getSafeContract({
        safeVersion,
        // we assume we're not going to deploy anything beyond L2s
        singletonDeployment: getSafeL2SingletonDeployment({
          network: chainId.toString(),
          version: safeVersion
        }),
        customContractAddress: CUSTOM_CONTRACTS_CHAINS.includes(chainId)
          ? CUSTOM_CONTRACTS[chainId].fallbackHandlerAddress
          : undefined
      });
      const safeContractAddress = readOnlySafeContract.getAddress();

      const callData = {
        owners: safeAccountConfig.owners,
        threshold: safeAccountConfig.threshold,
        to: ZERO_ADDRESS,
        data: '0x',
        fallbackHandler: fallbackHandlerAddress,
        paymentToken: ZERO_ADDRESS,
        payment: 0,
        paymentReceiver: ZERO_ADDRESS
      };

      const initializer = readOnlySafeContract.encode('setup', [
        callData.owners,
        callData.threshold,
        callData.to,
        callData.data,
        callData.fallbackHandler,
        callData.paymentToken,
        callData.payment,
        callData.paymentReceiver
      ]);

      const createProxyWithNonceCallData = readOnlyProxyFactoryContract.encode(
        'createProxyWithNonce',
        [safeContractAddress, initializer, saltNonce]
      );

      const relayResponse: RelayResponse = await relayKit.sendSponsorTransaction(
        proxyFactoryAddress,
        createProxyWithNonceCallData,
        chainId
      );

      const transactionHash = await waitForRelayTaskToComplete(relayKit, relayResponse.taskId);
      if (!transactionHash) {
        throw new Error("Transaction didn't complete");
      }

      if (callback) {
        callback(transactionHash);
      }
    }
    return predictedAddress as Address;
  } catch (error) {
    throw error;
  }
}

export async function safeTransferEth(
  ethersSigner: providers.JsonRpcSigner,
  tx: { from: Address; to: Address; amount: bigint; safeSigner?: Address }
): Promise<Hash | undefined> {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: ethersSigner
  });

  const chainId = await ethAdapter.getChainId();

  const contractNetworks = CUSTOM_CONTRACTS_CHAINS.includes(chainId) ? CUSTOM_CONTRACTS : undefined;

  const safe = await Safe.create({
    ethAdapter,
    safeAddress: tx.from as string,
    contractNetworks
  });

  const safeSingletonContract = await getSafeContract({
    ethAdapter,
    safeVersion: await safe.getContractVersion(),
    customContracts: contractNetworks ? contractNetworks[chainId] : undefined
  });

  const safeTransferTransactionData: MetaTransactionData = {
    to: tx.to,
    value: tx.amount.toString(),
    data: '0x',
    operation: OperationType.Call
  };

  if (isRelaySupported(chainId)) {
    const relayKit = getRelayKitForChainId(chainId);
    if (!relayKit) {
      toast.error('Relayer not available!');
      return;
    }

    try {
      const options: MetaTransactionOptions = {
        gasLimit: GAS_LIMIT.toString(),
        isSponsored: false
      };

      const standardizedSafeTx = await relayKit.createRelayedTransaction({
        safe,
        transactions: [safeTransferTransactionData],
        options
      });

      let signedSafeTx;
      if (tx.safeSigner) {
        const safeSigner = await Safe.create({
          ethAdapter,
          safeAddress: tx.safeSigner as string,
          contractNetworks
        });

        const safeSignature = await signTransactionBySafe(safe, safeSigner, standardizedSafeTx);
        if (!safeSignature) {
          return;
        }

        standardizedSafeTx.addSignature(safeSignature);

        signedSafeTx = standardizedSafeTx;
      } else {
        signedSafeTx = await safe.signTransaction(standardizedSafeTx);
      }

      const encodedTransaction = safeSingletonContract.encode('execTransaction', [
        signedSafeTx.data.to,
        signedSafeTx.data.value,
        signedSafeTx.data.data,
        signedSafeTx.data.operation,
        signedSafeTx.data.safeTxGas,
        signedSafeTx.data.baseGas,
        signedSafeTx.data.gasPrice,
        signedSafeTx.data.gasToken,
        signedSafeTx.data.refundReceiver,
        signedSafeTx.encodedSignatures()
      ]);

      const relayResponse: RelayResponse = await relayKit.sendSyncTransaction(
        tx.from,
        encodedTransaction,
        chainId,
        options
      );

      return await waitForRelayTaskToComplete(relayKit, relayResponse.taskId);
    } catch (error) {
      console.error('Failed to transfer: ', error);
      return;
    }
  } else {
    try {
      const standardizedSafeTx = await safe.createTransaction({
        safeTransactionData: safeTransferTransactionData
      });
      let signedSafeTx;
      if (tx.safeSigner) {
        const safeSigner = await Safe.create({
          ethAdapter,
          safeAddress: tx.safeSigner as string,
          contractNetworks
        });

        const safeSignature = await signTransactionBySafe(safe, safeSigner, standardizedSafeTx);
        if (!safeSignature) {
          return;
        }

        standardizedSafeTx.addSignature(safeSignature);

        signedSafeTx = standardizedSafeTx;
      } else {
        signedSafeTx = await safe.signTransaction(standardizedSafeTx);
      }
      const response = await safe.executeTransaction(signedSafeTx);
      return response.hash as Hash;
    } catch (error) {
      console.error('Failed to transfer: ', error);
      return;
    }
  }
}

export async function safeTransferEthWithDeploy(
  ethersSigner: providers.JsonRpcSigner,
  tx: { from: Address; to: Address; amount: bigint; safeSigner?: Address },
  safeAccountConfig: SafeAccountConfig,
  safeVersion?: SafeVersion,
  saltNonce?: Hash,
  statusCallback?: (status: string | undefined) => void
): Promise<Hash | undefined> {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: ethersSigner
  });

  const safeAddress = tx.from;
  const chainId = await ethAdapter.getChainId();

  const isSafeDeployed = await ethAdapter.isContractDeployed(safeAddress);

  const safeDeploymentConfig = {
    saltNonce,
    safeVersion: safeVersion ?? LATEST_SAFE_VERSION
  } as SafeDeploymentConfig;

  const safeSdk = isSafeDeployed
    ? await Safe.create({ ethAdapter: ethAdapter, safeAddress })
    : await Safe.create({
        ethAdapter: ethAdapter,
        predictedSafe: { safeAccountConfig, safeDeploymentConfig }
      });

  console.debug(`${safeAddress} is deployed: ${isSafeDeployed}`);

  const safeTransactions: MetaTransactionData[] = [
    {
      to: tx.to,
      value: tx.amount.toString(),
      data: '0x',
      operation: OperationType.Call
    }
  ];

  console.debug('Safe txs', JSON.stringify(safeTransactions, null, 2));

  const relayKit = getRelayKitForChainId(chainId);
  if (!relayKit) {
    throw new Error('Relayer not available!');
  }

  // Relay the transaction
  const options: MetaTransactionOptions = {
    gasLimit: GAS_LIMIT.toString(),
    isSponsored: false
  };

  const relayedTransaction = await relayKit.createRelayedTransaction({
    safe: safeSdk,
    transactions: safeTransactions,
    options
  });

  statusCallback?.('signing');

  const signedSafeTransaction = await safeSdk.signTransaction(relayedTransaction);

  statusCallback?.('relaying');
  const relayResponse = await relayKit.executeRelayTransaction(signedSafeTransaction, safeSdk);

  return await waitForRelayTaskToComplete(relayKit, relayResponse.taskId);
}
