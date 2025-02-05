import { FlowType, FlowWalletType } from '@payflow/common';
import { SUPPORTED_CHAINS } from './networks';

export default function sortAndFilterFlows(flows: FlowType[]): FlowType[] {
  return flows
    .sort((a, b) => {
      // Rodeo and Bankr types go last
      if (a.type === 'RODEO' || a.type === 'BANKR') {
        if (b.type === 'RODEO' || b.type === 'BANKR') {
          // If both are Rodeo/Bankr, sort alphabetically
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        }
        return 1; // a goes after b
      }
      if (b.type === 'RODEO' || b.type === 'BANKR') return -1; // b goes after a

      // Special types after regular flows but before Rodeo/Bankr
      if (a.type === 'FARCASTER_VERIFICATION' || a.type === 'LINKED') {
        if (b.type === 'FARCASTER_VERIFICATION' || b.type === 'LINKED') {
          // If both are special types, sort alphabetically
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        }
        return 1;
      }
      if (b.type === 'FARCASTER_VERIFICATION' || b.type === 'LINKED') return -1;

      // Regular flows sorted alphabetically
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
