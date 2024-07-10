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

import { Hash, Address, keccak256, toBytes, toHex } from 'viem';
import { getRelayKitForChainId, getSponsoredCount, waitForRelayTaskToComplete } from './relayer';
import { getGasPrice } from 'wagmi/actions';
import { SUPPORTED_CHAINS } from './networks';
import { privyWagmiConfig } from './wagmiConfig';
import { ViemTransaction } from './hooks/useSafeTransfer';

export async function transferWithGelato(
  ethersSigner: JsonRpcSigner,
  tx: ViemTransaction,
  isSafeDeployed: boolean,
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

  const safeDeploymentConfig = {
    saltNonce: keccak256(toBytes(saltNonce)),
    safeVersion
  } as SafeDeploymentConfig;

  const predictedSafe: PredictedSafeProps = {
    safeAccountConfig,
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

  /*  safeFactory.deploySafe({
    safeAccountConfig: {
      ...safeAccountConfig,
      owners: ['']
    },
    saltNonce: keccak256(toBytes(saltNonce))
  }); */

  const predictedAddress = await safeFactory.predictSafeAddress(
    safeAccountConfig,
    keccak256(toBytes(saltNonce))
  );

  console.debug(
    `isSafeDeployed: ${isSafeDeployed} - pre-generated before: ${safeAddress} vs safeSdk.getAddress() ${await safeSdk.getAddress()} vs safeFactory.predictSafeAddress ${predictedAddress}`
  );

  const safeTransactions: MetaTransactionData[] = [
    {
      to: tx.to,
      value: tx.value ? toHex(tx.value) : '0',
      data: tx.data ?? '0x',
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

  const l1GasPrice = await getGasPrice(privyWagmiConfig, {
    chainId: isMainnetChain ? 1 : 11155111
  });
  const l2GasPrice = await getGasPrice(privyWagmiConfig, { chainId });

  const l1GasLimit = BigInt(isSafeDeployed ? 8_500 : 13_000);
  const l2GasLimit = BigInt(isSafeDeployed ? 200_000 : 500_000);

  const relayerFeeMultiplier = 1.1;

  const manualFeeEstimation =
    parseInt((l2GasLimit * l2GasPrice + l1GasLimit * l1GasPrice).toString()) * relayerFeeMultiplier;

  console.debug(isSafeDeployed, chainId, isMainnetChain, manualFeeEstimation);

  return parseFloat(manualFeeEstimation.toString()).toFixed().toString();
}
