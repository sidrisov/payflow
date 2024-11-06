/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
interface ImportMetaEnv {
  readonly VITE_INIT_CONNECT: string;
  readonly VITE_ALCHEMY_API_KEY: string;
  readonly VITE_INFURA_API_KEY: string;
  readonly VITE_BASE_RPC_API_KEY: string;
  readonly VITE_PAYFLOW_SERVICE_API_URL: string;
  readonly VITE_PAYFLOW_SERVICE_DAPP_URL: string;
  readonly VITE_PAYFLOW_SERVICE_FRAMES_URL: string;
  readonly VITE_DEFAULT_FLOW_CREATE2_SALT_NONCE: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_GELATO_TESTNET_API_KEY: string;
  readonly VITE_GELATO_MAINNET_API_KEY: string;
  readonly VITE_AIRSTACK_API_KEY: string;
  readonly VITE_MOXIE_API_KEY: string;
  readonly VITE_ENABLED_CHAINS: string;
  readonly VITE_DEFAULT_FLOW_CHAINS: string;
  readonly VITE_GELATO_SPONSORED_ENABLED: string;
  readonly VITE_FARCASTER_CONNECT_ENABLED: string;
  readonly VITE_PIMLICO_API_KEY: string;
  readonly VITE_PIMLICO_SPONSORED_ENABLED: string;
  readonly VITE_PIMLICO_SPONSORED_POLICY_BASE_SEPOLIA: string;
  readonly VITE_PIMLICO_SPONSORED_POLICY_BASE: string;
  readonly VITE_PIMLICO_SPONSORED_POLICY_OP: string;
  readonly VITE_PIMLICO_SPONSORED_POLICY_DEGEN: string;
  readonly VITE_PRIVY_API_KEY: string;
  readonly VITE_PRIVY_CLIENT_ID_KEY: string;
  readonly VITE_GLIDE_API_KEY: string;
  readonly VITE_SIMPLE_HASH_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __BUILD_INFO__: {
  version: string;
  commitHash: string;
  buildTime: string;
  vercelEnv: string;
  vercelGitCommitRef: string;
};
