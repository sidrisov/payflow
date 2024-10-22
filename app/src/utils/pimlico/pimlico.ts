import { http } from 'viem';
import { entryPoint06Address } from 'viem/account-abstraction';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import {
  arbitrum,
  base,
  baseSepolia,
  degen,
  mode,
  optimism,
  worldchain,
  zksync,
  zora
} from 'viem/chains';

export const PIMLICO_SPONSORED_ENABLED = import.meta.env.VITE_PIMLICO_SPONSORED_ENABLED === 'true';

export const transport = (chainId: number) => {
  return http(
    `https://api.pimlico.io/v2/${pimlicoRpcNetworkName(chainId)}/rpc?apikey=${
      import.meta.env.VITE_PIMLICO_API_KEY
    }`
  );
};

export const pimlicoClient = (chainId: number) => {
  return createPimlicoClient({
    transport: transport(chainId),
    entryPoint: {
      address: entryPoint06Address,
      version: '0.6'
    }
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
    case zksync.id:
      network = 'zksync-era';
      break;
    case arbitrum.id:
      network = 'arbitrum';
      break;
    case zora.id:
      network = 'zora';
      break;
    case degen.id:
      network = 'degen';
      break;
    case mode.id:
      network = 'mode';
      break;
    case worldchain.id:
      network = 'world';
      break;
  }
  return network;
};

// mainnet sponsorship policies
const MAINNET_POLICIES = JSON.parse(import.meta.env.VITE_PIMLICO_SPONSORED_POLICY_BASE) as string[];
// testnet sponsorship policies
const TESTNET_POLICIES = JSON.parse(
  import.meta.env.VITE_PIMLICO_SPONSORED_POLICY_BASE_SEPOLIA
) as string[];

export const paymasterSponsorshipPolicyIds = (chainId: number) => {
  switch (chainId) {
    case base.id:
      return MAINNET_POLICIES.slice(0, 1);
    case arbitrum.id:
    case optimism.id:
    case degen.id:
    case mode.id:
    case worldchain.id:
      return MAINNET_POLICIES.slice(1, 2);
    case baseSepolia.id:
      return TESTNET_POLICIES;
    default:
      return [];
  }
};

/* export const sponsorUserOperation = async (args: PimlicoSponsorUserOperationParameters<'0.6'>) => {
  const sponsorshipPolicyIds = pimlicoSponsorshipPolicyIds(chain.id);
  console.log(
    `Available sponsorshipPolicyIds ${sponsorshipPolicyIds} for userOperation: `,
    args.userOperation
  );

  const validatedPoliciyIds = await pimlicoClient(chain.id).validateSponsorshipPolicies({
    userOperation: args.userOperation as UserOperation<'0.6'>,
    sponsorshipPolicyIds
  });

  console.log(
    `Can be sponsored by ${JSON.stringify(validatedPoliciyIds)} for userOperation: `,
    args.userOperation
  );

  if (validatedPoliciyIds.length === 0) {
    throw Error('Sponsorshipt not available');
  }

  // return first
  return pimlicoClient(chain.id).getPaymasterData({
    ...args,
    context: {
      sponsorshipPolicyId: validatedPoliciyIds[0].sponsorshipPolicyId
    }
  } as any);
}; */
