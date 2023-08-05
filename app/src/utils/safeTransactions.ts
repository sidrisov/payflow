// attribution to Safe Developers, used those to write the logic
// https://github.com/safe-global/safe-wallet-web/blob/main/src/components/new-safe/create/logic/index.ts
// https://github.com/safe-global/safe-wallet-web/blob/main/src/services/contracts/safeContracts.ts
// https://github.com/safe-global/safe-wallet-web/blob/main/src/services/tx/relaying.ts

import { ethers, providers } from 'ethers';
import {
  getFallbackHandlerDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment
} from '@safe-global/safe-deployments';

import Safe, {
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
  SafeVersion
} from '@safe-global/safe-core-sdk-types';

import { RelayResponse, TransactionStatusResponse } from '@gelatonetwork/relay-sdk';

import { Hash, Address } from 'viem';
import { toast } from 'react-toastify';

const ZERO_ADDRESS = ethers.constants.AddressZero;
const LATEST_SAFE_VERSION = '1.3.0' as SafeVersion;
const GELATO_API_KEY = import.meta.env.VITE_GELATO_API_KEY;
const relayKit = new GelatoRelayPack(GELATO_API_KEY);

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

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
  const safeFactory = await SafeFactory.create({ ethAdapter, safeVersion });
  const predictedAddress = await safeFactory.predictSafeAddress(safeAccountConfig, saltNonce);

  if (!sponsored) {
    const safe = await safeFactory.deploySafe({
      safeAccountConfig,
      saltNonce,
      callback
    });

    if (!safe) {
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

    console.log(proxyFactoryAddress, fallbackHandlerAddress, safeContractAddress);

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

    console.log(
      `Relay Transaction Task ID: https://relay.gelato.digital/tasks/status/${relayResponse.taskId}`
    );

    let relayTaskResult: TransactionStatusResponse;
    do {
      await delay(2000);
      const relayExecResponse = await fetch(
        `https://relay.gelato.digital/tasks/status/${relayResponse.taskId}`
      );
      relayTaskResult = (await relayExecResponse.json()).task;

      console.log(relayTaskResult);
    } while (
      relayTaskResult &&
      (relayTaskResult.taskState === TaskState.CheckPending ||
        relayTaskResult.taskState === TaskState.ExecPending ||
        relayTaskResult.taskState === TaskState.WaitingForConfirmation)
    );

    if (!relayTaskResult) {
      toast.error('Failed to relay transaction!');
      return;
    }

    if (relayTaskResult.taskState !== TaskState.ExecSuccess) {
      toast.error(
        `Failed to relay transaction with: ${relayTaskResult.taskState}, ${
          relayTaskResult.lastCheckMessage ?? 'no error'
        }!`
      );
      return;
    }

    if (callback) {
      callback(relayTaskResult.transactionHash);
    }
  }
  return predictedAddress as Hash;
}

export async function safeTransferEth(
  ethersSigner: providers.JsonRpcSigner,
  tx: { from: Address; to: Address; amount: bigint }
): Promise<Hash> {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: ethersSigner
  });

  const safeSdk = await Safe.create({ ethAdapter, safeAddress: tx.from as string });

  const safeTransactionData: MetaTransactionData = {
    to: tx.to,
    value: tx.amount.toString(),
    data: '0x',
    operation: OperationType.Call
  };

  const options: MetaTransactionOptions = {
    gasLimit: '500000',
    isSponsored: false
  };

  const chainId = await safeSdk.getChainId();

  const standardizedSafeTx = await relayKit.createRelayedTransaction(
    safeSdk,
    [safeTransactionData],
    options
  );

  console.log(standardizedSafeTx);

  const signedSafeTx = await safeSdk.signTransaction(standardizedSafeTx);

  const safeSingletonContract = await getSafeContract({
    ethAdapter,
    safeVersion: await safeSdk.getContractVersion()
  });

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

  const relayResponse: RelayResponse = await relayKit.relayTransaction({
    target: tx.from,
    encodedTransaction,
    chainId,
    options
  });

  console.log(
    `Relay Transaction Task ID: https://relay.gelato.digital/tasks/status/${relayResponse.taskId}`
  );

  let relayTaskResult: TransactionStatusResponse;
  do {
    await delay(2000);
    const relayExecResponse = await fetch(
      `https://relay.gelato.digital/tasks/status/${relayResponse.taskId}`
    );
    relayTaskResult = (await relayExecResponse.json()).task;

    console.log(relayTaskResult);
  } while (
    relayTaskResult &&
    (relayTaskResult.taskState === TaskState.CheckPending ||
      relayTaskResult.taskState === TaskState.ExecPending ||
      relayTaskResult.taskState === TaskState.WaitingForConfirmation)
  );

  if (!relayTaskResult) {
    toast.error('Failed to relay transaction!');
  }

  if (relayTaskResult.taskState !== TaskState.ExecSuccess) {
    toast.error(
      `Failed to relay transaction with: ${relayTaskResult.taskState}, ${
        relayTaskResult.lastCheckMessage ?? 'no error'
      }!`
    );
  }

  return relayTaskResult.transactionHash as Hash;

  // TODO: not all testnets have transaction services, for now rely on onchain signatures
  //const senderSignature = await safeSdk.signTransactionHash(safeTxHash);

  //const txServiceUrl = 'https://safe-transaction-base-testnet.safe.global';
  //const safeService = new SafeApiKit({ txServiceUrl, ethAdapter });

  /*   await safeService.proposeTransaction({
    safeAddress: tx.from as string,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: await ethersSigner.getAddress(),
    senderSignature: senderSignature.data
  }); */

  /*   const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);

  await safeSdk.approveTransactionHash(safeTxHash);
  return (await safeSdk.executeTransaction(safeTransaction)).hash as Hash; */
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
