import { GelatoRelayPack } from '@safe-global/relay-kit';
import {
  arbitrumGoerli,
  base,
  baseGoerli,
  optimism,
  optimismGoerli,
  zkSyncTestnet
} from 'viem/chains';
import { Hash } from 'viem';
import { delay } from './delay';
import { TaskState } from '../types/TaskState';
import Safe from '@safe-global/protocol-kit';

const GELATO_TESTNET_API_KEY = import.meta.env.VITE_GELATO_TESTNET_API_KEY;
const GELATO_MAINNET_API_KEY = import.meta.env.VITE_GELATO_MAINNET_API_KEY;
const GELATO_SPONSORED_ENABLED = parseInt(import.meta.env.VITE_GELATO_SPONSORED_ENABLED) ?? 0;

const MAINNET_CHAINS_SUPPORTING_RELAY: number[] = [optimism.id, base.id];
const TESTNET_CHAINS_SUPPORTING_RELAY: number[] = [
  optimismGoerli.id,
  baseGoerli.id,
  arbitrumGoerli.id,
  zkSyncTestnet.id
];

export function getRelayKitForChainId(chainId: number, protocolKit: Safe) {
  if (MAINNET_CHAINS_SUPPORTING_RELAY.includes(chainId)) {
    return new GelatoRelayPack({ apiKey: GELATO_MAINNET_API_KEY, protocolKit });
  }

  if (TESTNET_CHAINS_SUPPORTING_RELAY.includes(chainId)) {
    return new GelatoRelayPack({ apiKey: GELATO_TESTNET_API_KEY, protocolKit });
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

export function getSponsoredCount() {
  console.debug(GELATO_SPONSORED_ENABLED);
  return GELATO_SPONSORED_ENABLED;
}

export async function waitForRelayTaskToComplete(
  relayKit: GelatoRelayPack,
  taskId: string,
  period: number = 3000,
  timeout: number = 60000
): Promise<Hash | undefined> {
  let relayTaskResult;

  const maxPolls = timeout / period;
  let pollCounter = 0;

  do {
    pollCounter++;
    await delay(period);

    relayTaskResult = await relayKit.getTaskStatus(taskId);
    console.debug('Relay Transaction Status for taskId', taskId, relayTaskResult);
  } while (
    relayTaskResult &&
    (relayTaskResult.taskState === TaskState.CheckPending ||
      relayTaskResult.taskState === TaskState.ExecPending ||
      relayTaskResult.taskState === TaskState.WaitingForConfirmation) &&
    pollCounter < maxPolls
  );

  if (!relayTaskResult) {
    throw new Error(`Failed to relay transaction for taskId: ${taskId}`);
  }

  if (relayTaskResult.taskState !== TaskState.ExecSuccess) {
    throw new Error(
      `Failed to relay transaction for taskId: ${taskId} - ${relayTaskResult.taskState}, ${
        relayTaskResult.lastCheckMessage ?? 'no error'
      }!`
    );
  }

  return relayTaskResult.transactionHash as Hash;
}
