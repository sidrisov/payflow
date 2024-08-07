import { Address, Chain, keccak256, toBytes } from 'viem';

import { FlowWalletType } from '../types/FlowType';
import { signerToSafeSmartAccount } from './permissionless_forked/signerToSafeSmartAccount';
import { ENTRYPOINT_ADDRESS_V06, isSmartAccountDeployed } from 'permissionless';
import { getClient } from 'wagmi/actions';
import { privyWagmiConfig } from './wagmiConfig';
import { SmartAccountSigner } from 'permissionless/accounts';

const DEFAULT_SAFE_VERSION = '1.4.1';

export default async function createSafeWallets(
  owners: Address[],
  saltNonce: string,
  chains: Chain[]
): Promise<FlowWalletType[]> {
  const deployPromises = chains.map(async (chain) => {
    const client = getClient(privyWagmiConfig, { chainId: chain.id });

    if (client) {
      const safeAccount = await signerToSafeSmartAccount(client as any, {
        entryPoint: ENTRYPOINT_ADDRESS_V06, // global entrypoint
        signer: {} as SmartAccountSigner,
        owners: owners,
        safeVersion: '1.4.1',
        saltNonce: BigInt(keccak256(toBytes(saltNonce)))
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
