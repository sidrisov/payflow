import { ENTRYPOINT_ADDRESS_V06, bundlerActions } from 'permissionless';
import {
  createPimlicoBundlerClient,
  createPimlicoPaymasterClient
} from 'permissionless/clients/pimlico';
import { http } from 'viem';
import { arbitrum, base, baseSepolia, optimism, zkSync, zora } from 'viem/chains';

export const PIMLICO_SPONSORED_ENABLED = import.meta.env.VITE_PIMLICO_SPONSORED_ENABLED === 'true';

export const transport = (chainId: number) => {
  return http(
    `https://api.pimlico.io/v1/${pimlicoRpcNetworkName(chainId)}/rpc?apikey=${
      import.meta.env.VITE_PIMLICO_API_KEY
    }`
  );
};

export const bundlerClient = (chainId: number) => {
  return createPimlicoBundlerClient({
    transport: http(
      `https://api.pimlico.io/v1/${pimlicoRpcNetworkName(chainId)}/rpc?apikey=${
        import.meta.env.VITE_PIMLICO_API_KEY
      }`
    ),
    entryPoint: ENTRYPOINT_ADDRESS_V06
  }).extend(bundlerActions(ENTRYPOINT_ADDRESS_V06));
};

export const paymasterClient = (chainId: number) => {
  return createPimlicoPaymasterClient({
    transport: http(
      `https://api.pimlico.io/v2/${pimlicoRpcNetworkName(chainId)}/rpc?apikey=${
        import.meta.env.VITE_PIMLICO_API_KEY
      }`
    ),
    entryPoint: ENTRYPOINT_ADDRESS_V06
  });
};

const pimlicoRpcNetworkName = (chainId: number) => {
  let network = '';
  switch (chainId) {
    case base.id:
      network = 'base';
      break;
    case baseSepolia.id:
      network = 'base-sepolia';
      break;
    case optimism.id:
      network = 'optimism';
      break;
    case zkSync.id:
      network = 'zksync-era';
      break;
    case arbitrum.id:
      network = 'arbitrum';
      break;
    case zora.id:
      network = 'zora';
      break;
  }
  return network;
};

export const paymasterSponsorshipPolicyId = (chainId: number) => {
  // default to dummy, so that sponsorship works only for supported chains
  let policyId = 'dummy';
  switch (chainId) {
    case base.id:
      policyId = import.meta.env.VITE_PIMLICO_SPONSORED_POLICY_BASE;
      break;
    case baseSepolia.id:
      policyId = import.meta.env.VITE_PIMLICO_SPONSORED_POLICY_BASE_SEPOLIA;
      break;
    case optimism.id:
      policyId = import.meta.env.VITE_PIMLICO_SPONSORED_POLICY_OP;
      break;
  }
  return policyId;
};
