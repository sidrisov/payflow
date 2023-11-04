import { SafeAccountConfig } from '@safe-global/protocol-kit';
import { Address, Chain, Hash } from 'viem';
import { safeDeploy } from './safeTransactions';
import { getEthersProvider } from './hooks/useEthersProvider';

import { providers } from 'ethers';
import { SafeWallet } from './hooks/useCreateSafeWallets';

export default async function createSafeWallets(
  owner: Address,
  saltNonce: Hash,
  chains: Chain[]
): Promise<{ chain: Chain; address: Address }[]> {
  const safeAccountConfig: SafeAccountConfig = {
    owners: [owner],
    threshold: 1
  };

  const deployPromises = chains.map(async (chain) => {
    const ethersProvider = getEthersProvider({ chainId: chain.id });
    const address = await safeDeploy({
      safeAccountConfig,
      ethersSigner: ethersProvider as providers.JsonRpcProvider,
      saltNonce,
      initialize: false
    });

    return {
      chain,
      address
    };
  });

  return await Promise.all(deployPromises);
}
