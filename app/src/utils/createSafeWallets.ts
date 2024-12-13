import { Address, Chain, keccak256, LocalAccount, toBytes } from 'viem';

import { FlowWalletType } from '../types/FlowType';
import { isSmartAccountDeployed } from 'permissionless';
import { getClient } from 'wagmi/actions';
import { wagmiConfig } from './wagmiConfig';
import { entryPoint06Address, entryPoint07Address } from 'viem/account-abstraction';
import { SAFE_CONSTANTS } from '@payflow/common';
import { RHINESTONE_ATTESTER_ADDRESS } from '@rhinestone/module-sdk';
import { toSafeSmartAccount } from './pimlico/toSafeSmartAccount';

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
          address:
            SAFE_CONSTANTS.AA_ENTRY_POINT_VERSION === '0.7'
              ? entryPoint07Address
              : entryPoint06Address,
          version: SAFE_CONSTANTS.AA_ENTRY_POINT_VERSION
        },
        version: SAFE_CONSTANTS.SAFE_SMART_ACCOUNT_VERSION,
        saltNonce: BigInt(keccak256(toBytes(saltNonce))),
        owners: owners.map((owner) => ({
          type: 'local',
          address: owner
        })) as [LocalAccount],
        safe4337ModuleAddress: SAFE_CONSTANTS.SAFE_4337_MODULE,
        erc7579LaunchpadAddress: SAFE_CONSTANTS.SAFE_ERC7579_LAUNCHPAD,
        attesters: [RHINESTONE_ATTESTER_ADDRESS],
        attestersThreshold: 1
      });

      const predictedAddress = safeAccount.address;
      const isSafeDeployed = await isSmartAccountDeployed(client, predictedAddress);

      console.debug(predictedAddress, chain.name, isSafeDeployed);

      return {
        network: chain.id,
        address: predictedAddress,
        deployed: isSafeDeployed,
        version:
          SAFE_CONSTANTS.SAFE_SMART_ACCOUNT_VERSION + '_' + SAFE_CONSTANTS.AA_ENTRY_POINT_VERSION
      };
    } else {
      throw Error('Empty client');
    }
  });

  return Promise.all(deployPromises);
}
