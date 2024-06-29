import { FlowType, FlowWalletType } from '../types/FlowType';
import { SUPPORTED_CHAINS } from './networks';

export default function sortAndFilterFlows(defaultFlow: FlowType, flows: FlowType[]): FlowType[] {
  return flows
    .sort((a, b) => {
      if (a.uuid === defaultFlow?.uuid) {
        return -1;
      }

      if (a.type === 'FARCASTER_VERIFICATION') {
        return 1;
      }

      if (a.type === 'LINKED') {
        return 1;
      }

      let fa = a.title.toLowerCase(),
        fb = b.title.toLowerCase();

      if (fa < fb) {
        return -1;
      }
      if (fa > fb) {
        return 1;
      }
      return 0;
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
