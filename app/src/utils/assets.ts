import { FlowType, FlowWalletType } from '../types/FlowType';
import { getTokensByChainIds } from '@payflow/common';

export default function getFlowAssets(flow: FlowType) {
  return flow.wallets.flatMap((wallet) =>
    wallet.network
      ? getTokensByChainIds([wallet.network]).map((token) => ({
          address: wallet.address,
          chainId: wallet.network,
          token
        }))
      : []
  );
}

export function getFlowWalletAssets(wallet: FlowWalletType) {
  return wallet.network
    ? getTokensByChainIds([wallet.network]).map((token) => ({
        address: wallet.address,
        chainId: wallet.network,
        token
      }))
    : [];
}

export function getFlowWalletsAssets(wallets: FlowWalletType[]) {
  return wallets.flatMap((wallet) =>
    wallet.network
      ? getTokensByChainIds([wallet.network]).map((token) => ({
          address: wallet.address,
          chainId: wallet.network,
          token
        }))
      : []
  );
}
