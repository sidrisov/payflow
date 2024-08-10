import { FlowType } from '../types/FlowType';
import { getSupportedTokens } from './erc20contracts';

export default function getFlowAssets(flow: FlowType) {
  return flow.wallets.flatMap((wallet) =>
    wallet.network
      ? getSupportedTokens(wallet.network).map((token) => ({
          address: wallet.address,
          chainId: wallet.network,
          token
        }))
      : []
  );
}
