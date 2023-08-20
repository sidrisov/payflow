import { GelatoRelayPack } from '@safe-global/relay-kit';
import { baseGoerli, optimism, optimismGoerli } from 'viem/chains';
import { TaskState } from '../types/TaskState';
import { toast } from 'react-toastify';
import { Hash } from 'viem';
import { TransactionStatusResponse } from '@gelatonetwork/relay-sdk';
import { delay } from './delay';

const GELATO_TESTNET_API_KEY = import.meta.env.VITE_GELATO_TESTNET_API_KEY;
const GELATO_MAINNET_API_KEY = import.meta.env.VITE_GELATO_MAINNET_API_KEY;

const RELAY_KIT_TESTNET = new GelatoRelayPack(GELATO_TESTNET_API_KEY);
const RELAY_KIT_MAINNET = new GelatoRelayPack(GELATO_MAINNET_API_KEY);

const MAINNET_CHAINS_SUPPORTING_RELAY: number[] = [optimism.id];
const TESTNET_CHAINS_SUPPORTING_RELAY: number[] = [optimismGoerli.id, baseGoerli.id];

export function getRelayKitForChainId(chainId: number) {
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

export async function waitForRelayTaskToComplete(
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
