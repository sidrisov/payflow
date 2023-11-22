import Safe, {
  EthersAdapter,
  SafeAccountConfig,
  SafeDeploymentConfig,
  SafeFactory
} from '@safe-global/protocol-kit';
import { Address, Chain, keccak256, toBytes } from 'viem';
import { getEthersProvider } from './hooks/useEthersProvider';

import { ethers } from 'ethers';
import { getFallbackHandler } from './safeTransactions';

export default async function createSafeWallets(
  owner: Address,
  saltNonce: string,
  chains: Chain[]
): Promise<{ chain: Chain; address: Address }[]> {
  const deployPromises = chains.map(async (chain) => {
    // there is a bug where safe sdk will modify the state of safe account config,
    // thus changing fallbackhandle, thus changing the initiator, thus changing the create2 address
    const fallbackHandler = getFallbackHandler(chain.id);

    // probably the same issue with Safe singleton address
    const safeAccountConfig: SafeAccountConfig = {
      owners: [owner],
      threshold: 1,
      fallbackHandler
    };

    const safeDeploymentConfig = {
      safeVersion: '1.3.0',
      saltNonce: keccak256(toBytes(saltNonce))
    } as SafeDeploymentConfig;

    console.log(safeAccountConfig, safeDeploymentConfig);

    const ethersProvider = getEthersProvider({ chainId: chain.id });

    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: ethersProvider
    });

    const safeFactory = await SafeFactory.create({
      ethAdapter,
      safeVersion: '1.3.0'
    });

    const safe = await Safe.create({
      ethAdapter: ethAdapter,
      predictedSafe: {
        safeAccountConfig,
        safeDeploymentConfig
      }
    });

    const predictedAddress = (await safe.getAddress()) as Address;

    console.log(predictedAddress, chain.name);

    return {
      chain,
      address: predictedAddress
    };
  });

  return await Promise.all(deployPromises);
}
