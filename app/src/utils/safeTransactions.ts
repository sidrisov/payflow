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
  EthSafeSignature,
  EthersAdapter,
  SafeAccountConfig,
  SafeFactory,
  getSafeContract,
  ContractNetworksConfig
} from '@safe-global/protocol-kit';

import { GelatoRelayPack } from '@safe-global/relay-kit';
import {
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType,
  SafeSignature,
  SafeVersion
} from '@safe-global/safe-core-sdk-types';

import { RelayResponse, TransactionStatusResponse } from '@gelatonetwork/relay-sdk';

import { Hash, Address } from 'viem';
import { toast } from 'react-toastify';
import { delay } from './delay';
import { baseGoerli, modeTestnet, optimism, optimismGoerli, zoraTestnet } from 'wagmi/chains';

const ZERO_ADDRESS = ethers.constants.AddressZero;
const LATEST_SAFE_VERSION = '1.3.0' as SafeVersion;

const GELATO_TESTNET_API_KEY = import.meta.env.VITE_GELATO_TESTNET_API_KEY;
const GELATO_MAINNET_API_KEY = import.meta.env.VITE_GELATO_MAINNET_API_KEY;

const RELAY_KIT_TESTNET = new GelatoRelayPack(GELATO_TESTNET_API_KEY);
const RELAY_KIT_MAINNET = new GelatoRelayPack(GELATO_MAINNET_API_KEY);

const MAINNET_CHAINS_SUPPORTING_RELAY: number[] = [optimism.id];
const TESTNET_CHAINS_SUPPORTING_RELAY: number[] = [optimismGoerli.id, baseGoerli.id];
const CUSTOM_CHAINS: number[] = [zoraTestnet.id, modeTestnet.id];

const CONTRACT_NETWORKS: ContractNetworksConfig = {
  [zoraTestnet.id]: {
    safeMasterCopyAddress: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
    safeProxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
    multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
    multiSendCallOnlyAddress: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
    fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
    signMessageLibAddress: '0x98FFBBF51bb33A056B08ddf711f289936AafF717',
    createCallAddress: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4',
    simulateTxAccessorAddress: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da'
  },
  [modeTestnet.id]: {
    safeMasterCopyAddress: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
    safeProxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
    multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
    multiSendCallOnlyAddress: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
    fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
    signMessageLibAddress: '0x98FFBBF51bb33A056B08ddf711f289936AafF717',
    createCallAddress: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4',
    simulateTxAccessorAddress: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da'
  }
};

// TODO: update to safeVersion: "1.4.1" (AA compatible once Safe deploys relevant contracts)
export async function safeDeploy({
  ethersSigner,
  safeAccountConfig,
  saltNonce,
  safeVersion = LATEST_SAFE_VERSION,
  sponsored = false,
  callback
}: {
  ethersSigner: providers.JsonRpcSigner;
  safeAccountConfig: SafeAccountConfig;
  saltNonce: Hash;
  safeVersion?: SafeVersion;
  sponsored?: boolean;
  callback?: (txHash: string | undefined) => void;
}): Promise<Address | undefined> {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: ethersSigner
  });

  const chainId = await ethAdapter.getChainId();

  const contractNetworks = CUSTOM_CHAINS.includes(chainId) ? CONTRACT_NETWORKS : undefined;

  const safeFactory = await SafeFactory.create({
    ethAdapter,
    safeVersion,
    contractNetworks
  });

  const predictedAddress = await safeFactory.predictSafeAddress(safeAccountConfig, saltNonce);

  try {
    // deploy without relaying
    if (!sponsored || !isRelaySupported(chainId)) {
      const safe = await safeFactory.deploySafe({
        safeAccountConfig,
        saltNonce,
        callback
      });

      if (!safe) {
        console.error('Failed to deploy safe');
        return;
      }
    } else {
      const relayKit = getRelayKitForChainId(chainId);
      if (!relayKit) {
        console.error('Relayer not supported for: ', chainId);
        return;
      }

      const readOnlyProxyFactoryContract = await ethAdapter.getSafeProxyFactoryContract({
        safeVersion,
        singletonDeployment: getProxyFactoryDeployment({
          network: chainId.toString(),
          version: safeVersion
        })
      });

      const proxyFactoryAddress = readOnlyProxyFactoryContract.getAddress();
      const readOnlyFallbackHandlerContract =
        await ethAdapter.getCompatibilityFallbackHandlerContract({
          safeVersion,
          singletonDeployment: getFallbackHandlerDeployment({
            network: chainId.toString(),
            version: safeVersion
          })
        });
      const fallbackHandlerAddress = readOnlyFallbackHandlerContract.getAddress();
      const readOnlySafeContract = await ethAdapter.getSafeContract({
        safeVersion,
        // we assume we're not going to deploy anything beyond L2s
        singletonDeployment: getSafeL2SingletonDeployment({
          network: chainId.toString(),
          version: safeVersion
        })
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

      const transactionHash = await waitForRelayTaskToComplete(relayResponse.taskId);

      if (callback) {
        callback(transactionHash);
      }
    }
    return predictedAddress as Address;
  } catch (error) {
    console.error('Failed to deploy safe: ', error);
    return;
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

  const contractNetworks = CUSTOM_CHAINS.includes(chainId) ? CONTRACT_NETWORKS : undefined;

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
    const relayKit = MAINNET_CHAINS_SUPPORTING_RELAY.includes(chainId)
      ? RELAY_KIT_MAINNET
      : RELAY_KIT_TESTNET;

    try {
      const options: MetaTransactionOptions = {
        gasLimit: '500000',
        isSponsored: false
      };

      const standardizedSafeTx = await relayKit.createRelayedTransaction(
        safe,
        [safeTransferTransactionData],
        options
      );

      let signedSafeTx;
      if (tx.safeSigner) {
        const safeSigner = await Safe.create({
          ethAdapter,
          safeAddress: tx.safeSigner as string,
          contractNetworks
        });
        const safeTxTransferHash = await safe.getTransactionHash(standardizedSafeTx);

        const safeTxApproveHashData: MetaTransactionData = {
          to: tx.from,
          value: '0',
          data: safeSingletonContract.encode('approveHash', [safeTxTransferHash]),
          operation: OperationType.Call
        };

        const safeTxApproveHash = await safeSigner.createTransaction({
          safeTransactionData: safeTxApproveHashData
        });

        const signedSafeTxApproveHash = await safeSigner.signTransaction(safeTxApproveHash);

        const encodedSafeTxApproveHash = safeSingletonContract.encode('execTransaction', [
          signedSafeTxApproveHash.data.to,
          signedSafeTxApproveHash.data.value,
          signedSafeTxApproveHash.data.data,
          signedSafeTxApproveHash.data.operation,
          signedSafeTxApproveHash.data.safeTxGas,
          signedSafeTxApproveHash.data.baseGas,
          signedSafeTxApproveHash.data.gasPrice,
          signedSafeTxApproveHash.data.gasToken,
          signedSafeTxApproveHash.data.refundReceiver,
          signedSafeTxApproveHash.encodedSignatures()
        ]);

        const relayResponse: RelayResponse = await relayKit.sendSponsorTransaction(
          tx.safeSigner,
          encodedSafeTxApproveHash,
          chainId
        );

        if (!(await waitForRelayTaskToComplete(relayResponse.taskId))) {
          return;
        }

        standardizedSafeTx.addSignature(generatePreValidatedSignature(tx.safeSigner));

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

      return await waitForRelayTaskToComplete(relayResponse.taskId);
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
        const safeTxTransferHash = await safe.getTransactionHash(standardizedSafeTx);

        const safeTxApproveHashData: MetaTransactionData = {
          to: tx.from,
          value: '0',
          data: safeSingletonContract.encode('approveHash', [safeTxTransferHash]),
          operation: OperationType.Call
        };

        const safeTxApproveHash = await safeSigner.createTransaction({
          safeTransactionData: safeTxApproveHashData
        });

        const signedSafeTxApproveHash = await safeSigner.signTransaction(safeTxApproveHash);

        const response = await safeSigner.executeTransaction(
          signedSafeTxApproveHash /* {
          //gasLimit: 500000
        } */
        );
        if (!response.hash) {
          return;
        }
        const ownersWhoApprovedTx = await waitForOwnersWhoApprovedTx(
          safe,
          safeTxTransferHash as Hash
        );

        if (!ownersWhoApprovedTx) {
          return;
        }

        for (const owner of ownersWhoApprovedTx) {
          standardizedSafeTx.addSignature(generatePreValidatedSignature(owner));
        }

        signedSafeTx = standardizedSafeTx;
      } else {
        signedSafeTx = await safe.signTransaction(standardizedSafeTx);
      }
      const response = await safe.executeTransaction(signedSafeTx /* { gasLimit: 500000 } */);
      return response.hash as Hash;
    } catch (error) {
      console.error('Failed to transfer: ', error);
      return;
    }
  }
}

// TaskState is not exported by gelato-sdk, declare here
declare enum TaskState {
  CheckPending = 'CheckPending',
  ExecPending = 'ExecPending',
  ExecSuccess = 'ExecSuccess',
  ExecReverted = 'ExecReverted',
  WaitingForConfirmation = 'WaitingForConfirmation',
  Blacklisted = 'Blacklisted',
  Cancelled = 'Cancelled',
  NotFound = 'NotFound'
}

async function waitForRelayTaskToComplete(
  taskId: string,
  period: number = 3000,
  timeout: number = 60000
): Promise<Hash | undefined> {
  console.log(`Relay Transaction Task ID: https://relay.gelato.digital/tasks/status/${taskId}`);

  let relayTaskResult: TransactionStatusResponse;

  const maxPolls = timeout / period;
  let pollCounter = 0;

  do {
    pollCounter++;
    await delay(period);
    const relayExecResponse = await fetch(`https://relay.gelato.digital/tasks/status/${taskId}`);
    relayTaskResult = (await relayExecResponse.json()).task;

    console.log(relayTaskResult);
  } while (
    relayTaskResult &&
    (relayTaskResult.taskState === TaskState.CheckPending ||
      relayTaskResult.taskState === TaskState.ExecPending ||
      relayTaskResult.taskState === TaskState.WaitingForConfirmation) &&
    pollCounter < maxPolls
  );

  if (!relayTaskResult) {
    toast.error('Failed to relay transaction!');
    return;
  }

  if (relayTaskResult.taskState !== TaskState.ExecSuccess) {
    toast.error(
      `Failed to relay transaction: ${relayTaskResult.taskState}, ${
        relayTaskResult.lastCheckMessage ?? 'no error'
      }!`
    );
    return;
  }

  return relayTaskResult.transactionHash as Hash;
}

async function waitForOwnersWhoApprovedTx(
  safe: Safe,
  hash: Hash,
  period: number = 3000,
  timeout: number = 30000
): Promise<Address[] | undefined> {
  const maxPolls = timeout / period;
  let pollCounter = 0;

  let ownersWhoApprovedTx;
  do {
    pollCounter++;
    await delay(period);
    ownersWhoApprovedTx = await safe.getOwnersWhoApprovedTx(hash);
  } while (ownersWhoApprovedTx.length === 0 && pollCounter < maxPolls);

  if (!ownersWhoApprovedTx || ownersWhoApprovedTx.length === 0) {
    toast.error('Transaction timeout!');
    return;
  }

  return ownersWhoApprovedTx as Address[];
}

export function generatePreValidatedSignature(ownerAddress: string): SafeSignature {
  const signature =
    '0x000000000000000000000000' +
    ownerAddress.slice(2) +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '01';

  return new EthSafeSignature(ownerAddress, signature);
}

function getRelayKitForChainId(chainId: number) {
  if (MAINNET_CHAINS_SUPPORTING_RELAY.includes(chainId)) {
    return RELAY_KIT_MAINNET;
  }

  if (TESTNET_CHAINS_SUPPORTING_RELAY.includes(chainId)) {
    return RELAY_KIT_TESTNET;
  }

  return;
}

export function isRelaySupported(chainId: number | undefined) {
  if (
    chainId &&
    (MAINNET_CHAINS_SUPPORTING_RELAY.includes(chainId) ||
      TESTNET_CHAINS_SUPPORTING_RELAY.includes(chainId))
  ) {
    return true;
  }

  return false;
}
