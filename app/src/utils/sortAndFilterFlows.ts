import { FlowType } from '../types/FlowType';
import { SUPPORTED_CHAINS } from './networks';

export default function sortAndFilterFlows(defaultFlow: FlowType, flows: FlowType[]): FlowType[] {
  return flows
    .sort((a, b) => {
      if (a.uuid === defaultFlow?.uuid) {
        return -1;
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
    .map((f) => {
      return {
        ...f,
        wallets: f.wallets.filter((w) =>
          SUPPORTED_CHAINS.map((c) => c.id as number).includes(w.network)
        )
      };
    });
}
