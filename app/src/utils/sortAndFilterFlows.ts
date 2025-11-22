import { FlowType, FlowWalletType } from '@payflow/common';
import { SUPPORTED_CHAINS } from './networks';

export default function sortAndFilterFlows(flows: FlowType[]): FlowType[] {
  return flows
    .filter((flow) => {
      // Filter out deprecated flow types that may still come from backend
      const flowType = flow.type as string | undefined;
      return flowType !== 'LINKED' && flowType !== 'REGULAR';
    })
    .sort((a, b) => {
      // Farcaster verification flows after connected flows
      if (a.type === 'FARCASTER_VERIFICATION') {
        if (b.type === 'FARCASTER_VERIFICATION') {
          // If both are farcaster, sort alphabetically
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        }
        return 1;
      }
      if (b.type === 'FARCASTER_VERIFICATION') return -1;

      // Connected flows sorted alphabetically
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    })
    .map((f) => sortAndFilterFlowWallets(f));
}

export function sortAndFilterFlowWallets(flow: FlowType): FlowType {
  return {
    ...flow,
    wallets: sortAndFilterWallets(flow.wallets)
  };
}

export function sortAndFilterWallets(wallets: FlowWalletType[]): FlowWalletType[] {
  return wallets
    .filter((w) => SUPPORTED_CHAINS.map((c) => c.id as number).includes(w.network))
    .sort((a, b) => {
      if (SUPPORTED_CHAINS.find((c) => c.id === a.network)?.testnet === true) {
        return 1;
      }

      if (SUPPORTED_CHAINS.find((c) => c.id === b.network)?.testnet === true) {
        return -1;
      }

      return 0;
    });
}
