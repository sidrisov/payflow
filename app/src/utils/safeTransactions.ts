// attribution to Safe Developers, used those to write the logic
// https://github.com/safe-global/safe-wallet-web/blob/main/src/components/new-safe/create/logic/index.ts
// https://github.com/safe-global/safe-wallet-web/blob/main/src/services/contracts/safeContracts.ts
// https://github.com/safe-global/safe-wallet-web/blob/main/src/services/tx/relaying.ts
// https://github.com/safe-global/safe-core-sdk/blob/main/packages/protocol-kit/src/utils/signatures/utils.ts

import { ethers, JsonRpcSigner, JsonRpcProvider, FallbackProvider } from 'ethers';

import Safe, {
  EthersAdapter,
  PredictedSafeProps,
  SafeAccountConfig,
  SafeDeploymentConfig,
  SafeFactory
} from '@safe-global/protocol-kit';

import {
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType,
  SafeVersion
} from '@safe-global/safe-core-sdk-types';

import { Hash, Address, keccak256, toBytes } from 'viem';
import { getRelayKitForChainId, getSponsoredCount, waitForRelayTaskToComplete } from './relayer';
import { getGasPrice } from 'wagmi/actions';
import { arbitrumGoerli, zkSyncSepoliaTestnet } from 'viem/chains';
import { SUPPORTED_CHAINS } from './networks';
import { wagmiConfig } from './wagmiConfig';

export async function safeTransferEthWithDeploy(
  ethersSigner: JsonRpcSigner,
  tx: { from: Address; to: Address; amount: bigint },
  safeAccountConfig: SafeAccountConfig,
  safeVersion: SafeVersion,
  saltNonce: string,
  statusCallback?: (status: string | undefined) => void
): Promise<Hash | undefined> {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: ethersSigner
  });

  const safeAddress = tx.from;
  const chainId = Number(await ethAdapter.getChainId());

  const isSafeDeployed = await ethAdapter.isContractDeployed(safeAddress);

  const safeDeploymentConfig = {
    saltNonce: keccak256(toBytes(saltNonce)),
    safeVersion
  } as SafeDeploymentConfig;

  const fallbackHandler = getFallbackHandler(chainId);

  const predictedSafe: PredictedSafeProps = {
    safeAccountConfig: {
      ...safeAccountConfig,
      fallbackHandler
    },
    safeDeploymentConfig
  };

  console.debug(predictedSafe);

  const safeSdk = isSafeDeployed
    ? await Safe.create({ ethAdapter, safeAddress })
    : await Safe.create({
        ethAdapter,
        predictedSafe
      });

  const safeFactory = await SafeFactory.create({
    ethAdapter,
    safeVersion
  });

  const predictedAddress = await safeFactory.predictSafeAddress(
    {
      ...safeAccountConfig,
      fallbackHandler
    },
    keccak256(toBytes(saltNonce))
  );

  console.debug(
    `isSafeDeployed: ${isSafeDeployed} - pre-generated before: ${safeAddress} vs safeSdk.getAddress() ${await safeSdk.getAddress()} vs safeFactory.predictSafeAddress ${predictedAddress}`
  );

  const safeTransactions: MetaTransactionData[] = [
    {
      to: tx.to,
      value: tx.amount.toString(),
      data: '0x',
      operation: OperationType.Call
    }
  ];

  console.debug('Safe txs', JSON.stringify(safeTransactions, null, 2));

  const isSponsored = getSponsoredCount() > 0 && (await safeSdk.getNonce()) < getSponsoredCount();

  // Relay the transaction
  const options: MetaTransactionOptions = {
    isSponsored
  };

  const relayKit = getRelayKitForChainId(chainId, safeSdk);
  if (!relayKit) {
    throw new Error('Relayer not available!');
  }

  const relayedTransaction = await relayKit.createRelayedTransaction({
    transactions: safeTransactions,
    options
  });

  if (!isSponsored) {
    relayedTransaction.data.baseGas = await estimateFee(await safeSdk.isSafeDeployed(), chainId);
  }

  statusCallback?.('signing');

  const signedSafeTransaction = await safeSdk.signTransaction(relayedTransaction);

  statusCallback?.('relaying');

  const relayResponse = await relayKit.executeRelayTransaction(signedSafeTransaction, options);

  return await waitForRelayTaskToComplete(relayKit, relayResponse.taskId);
}

export async function isSafeSponsored(
  ethersProvider: JsonRpcProvider | FallbackProvider,
  safeAddress: Address
) {
  if (getSponsoredCount() === 0) {
    return false;
  }

  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: ethersProvider
  });

  let safeNonce = 0;

  const isSafeDeployed = await ethAdapter.isContractDeployed(safeAddress);
  if (isSafeDeployed) {
    const safeSdk = await Safe.create({ ethAdapter, safeAddress });
    safeNonce = await safeSdk.getNonce();
  }

  return safeNonce < getSponsoredCount();
}

export async function estimateFee(isSafeDeployed: boolean, chainId: number): Promise<string> {
  const isMainnetChain = !SUPPORTED_CHAINS.find((c) => c.id === chainId)?.testnet;

  const l1GasPrice = await getGasPrice(wagmiConfig, {
    chainId: isMainnetChain ? 1 : 5
  });
  const l2GasPrice = await getGasPrice(wagmiConfig, { chainId });

  const l1GasLimit = BigInt(isSafeDeployed ? 8_500 : 13_000);
  const l2GasLimit = BigInt(isSafeDeployed ? 200_000 : 500_000);

  const relayerFeeMultiplier = 1.1;

  const manualFeeEstimation =
    parseInt((l2GasLimit * l2GasPrice + l1GasLimit * l1GasPrice).toString()) * relayerFeeMultiplier;

  console.debug(isSafeDeployed, chainId, isMainnetChain, manualFeeEstimation);

  return parseFloat(manualFeeEstimation.toString()).toFixed().toString();
}

export function getFallbackHandler(chainId: number): Address {
  return chainId == zkSyncSepoliaTestnet.id
    ? '0x2f870a80647BbC554F3a0EBD093f11B4d2a7492A'
    : chainId === arbitrumGoerli.id
    ? '0xf48f2b2d2a534e402487b3ee7c18c33aec0fe5e4'
    : '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804';
}
