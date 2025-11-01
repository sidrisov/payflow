import { FlowType, FlowWalletType } from '@payflow/common';
import { getTokensByChainIds } from '@payflow/common';
import { isSupportedChain } from './networks';

export default function getFlowAssets(flow: FlowType) {
  return flow.wallets
    .filter((wallet) => wallet.network && isSupportedChain(wallet.network))
    .flatMap((wallet) =>
      getTokensByChainIds([wallet.network]).map((token) => ({
        address: wallet.address,
        chainId: wallet.network,
        token
      }))
    );
}

export function getFlowWalletAssets(wallet: FlowWalletType) {
  return wallet.network && isSupportedChain(wallet.network)
    ? getTokensByChainIds([wallet.network]).map((token) => ({
        address: wallet.address,
        chainId: wallet.network,
        token
      }))
    : [];
}

export function getFlowWalletsAssets(wallets: FlowWalletType[]) {
  return wallets
    .filter((wallet) => wallet.network && isSupportedChain(wallet.network))
    .flatMap((wallet) =>
      getTokensByChainIds([wallet.network]).map((token) => ({
        address: wallet.address,
        chainId: wallet.network,
        token
      }))
    );
}
