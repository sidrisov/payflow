import Safe, {
  EthersAdapter,
  SafeAccountConfig,
  SafeDeploymentConfig
} from '@safe-global/protocol-kit';
import { Address, Chain, keccak256, toBytes } from 'viem';
import { getEthersProvider } from './hooks/useEthersProvider';

import { ethers } from 'ethers';
import { getFallbackHandler } from './safeTransactions';
import { FlowWalletType } from '../types/FlowType';

const DEFAULT_SAFE_VERSION = '1.3.0';

export default async function createSafeWallets(
  owner: Address,
  saltNonce: string,
  chains: Chain[]
): Promise<FlowWalletType[]> {
  const deployPromises = chains.map(async (chain) => {
    // there is a bug where safe sdk will modify the state of safe account config,
    // thus changing fallbackhandle, thus changing the initiator, thus changing the create2 address
    const fallbackHandler = getFallbackHandler(chain.id);

    const ethersProvider = getEthersProvider({ chainId: chain.id });

    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: ethersProvider
    });

    // probably the same issue with Safe singleton address
    const safeAccountConfig: SafeAccountConfig = {
      owners: [owner],
      threshold: 1,
      fallbackHandler
    };

    const safeDeploymentConfig = {
      safeVersion: DEFAULT_SAFE_VERSION,
      saltNonce: keccak256(toBytes(saltNonce))
    } as SafeDeploymentConfig;

    console.log(safeAccountConfig, safeDeploymentConfig);

    const safe = await Safe.create({
      ethAdapter: ethAdapter,
      predictedSafe: {
        safeAccountConfig,
        safeDeploymentConfig
      }
    });

    const predictedAddress = (await safe.getAddress()) as Address;

    const isSafeDeployed = await ethAdapter.isContractDeployed(predictedAddress);

    console.log(predictedAddress, chain.name, isSafeDeployed);

    return {
      network: chain.id,
      address: predictedAddress,
      deployed: isSafeDeployed,
      version: DEFAULT_SAFE_VERSION
    } as FlowWalletType;
  });

  return Promise.all(deployPromises);
}
