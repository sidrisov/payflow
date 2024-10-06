import { Address, Chain, keccak256, LocalAccount, toBytes } from 'viem';

import { FlowWalletType } from '../types/FlowType';
import { isSmartAccountDeployed } from 'permissionless';
import { getClient } from 'wagmi/actions';
import { wagmiConfig } from './wagmiConfig';
import { entryPoint06Address } from 'viem/account-abstraction';
import { toSafeSmartAccount } from './pimlico/toSafeSmartAccount';
const DEFAULT_SAFE_VERSION = '1.4.1';

export default async function createSafeWallets(
  owners: Address[],
  saltNonce: string,
  chains: Chain[]
): Promise<FlowWalletType[]> {
  const deployPromises = chains.map(async (chain) => {
    const client = getClient(wagmiConfig, { chainId: chain.id });

    if (client) {
      const safeAccount = await toSafeSmartAccount({
        client,
        entryPoint: {
          address: entryPoint06Address,
          version: '0.6'
        },
        version: '1.4.1',
        saltNonce: BigInt(keccak256(toBytes(saltNonce))),
        owners: owners.map((owner) => ({
          type: 'local',
          address: owner
        })) as [LocalAccount]
      });

      const predictedAddress = safeAccount.address;
      const isSafeDeployed = await isSmartAccountDeployed(client, predictedAddress);

      console.debug(predictedAddress, chain.name, isSafeDeployed);

      return {
        network: chain.id,
        address: predictedAddress,
        deployed: isSafeDeployed,
        version: DEFAULT_SAFE_VERSION
      } as FlowWalletType;
    } else {
      throw Error('Empty client');
    }
  });

  return Promise.all(deployPromises);
}
