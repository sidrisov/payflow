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
  getSafeContract
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

const ZERO_ADDRESS = ethers.constants.AddressZero;
const LATEST_SAFE_VERSION = '1.3.0' as SafeVersion;
const GELATO_API_KEY = import.meta.env.VITE_GELATO_API_KEY;
const relayKit = new GelatoRelayPack(GELATO_API_KEY);

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

  try {
    const safeFactory = await SafeFactory.create({ ethAdapter, safeVersion });
    const predictedAddress = await safeFactory.predictSafeAddress(safeAccountConfig, saltNonce);

    safeAccountConfig.paymentReceiver;
    if (!sponsored) {
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
      const chainId = await ethAdapter.getChainId();
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

  try {
    const safe = await Safe.create({ ethAdapter, safeAddress: tx.from as string });
    const safeSingletonContract = await getSafeContract({
      ethAdapter,
      safeVersion: await safe.getContractVersion()
    });
    const chainId = await safe.getChainId();

    const options: MetaTransactionOptions = {
      gasLimit: '500000',
      isSponsored: false
    };

    console.log(tx.amount.toString());
    const safeTransferTransactionData: MetaTransactionData = {
      to: tx.to,
      value: tx.amount.toString(),
      data: '0x',
      operation: OperationType.Call
    };

    const standardizedSafeTx = await relayKit.createRelayedTransaction(
      safe,
      [safeTransferTransactionData],
      options
    );

    let signedSafeTx;
    if (tx.safeSigner) {
      const safeSigner = await Safe.create({ ethAdapter, safeAddress: tx.safeSigner as string });
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

      // TODO: add a logic where we don't sponsor approvalHash call
      /*     let ownersWhoApprovedTx;
    do {
      await delay(1000);
      ownersWhoApprovedTx = await safe.getOwnersWhoApprovedTx(safeTxTransferHash);
      console.log({ ownersWhoApprovedTx });
    } while (ownersWhoApprovedTx.length === 0);

    for (const owner of ownersWhoApprovedTx) {
      standardizedSafeTx.addSignature(generatePreValidatedSignature(owner));
    } */

      signedSafeTx = standardizedSafeTx;
    } else {
      signedSafeTx = await safe.signTransaction(standardizedSafeTx);
    }

    console.log({ signedSafeTx });

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

export function generatePreValidatedSignature(ownerAddress: string): SafeSignature {
  const signature =
    '0x000000000000000000000000' +
    ownerAddress.slice(2) +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '01';

  return new EthSafeSignature(ownerAddress, signature);
}
