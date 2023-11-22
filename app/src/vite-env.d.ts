/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
interface ImportMetaEnv {
  readonly VITE_INIT_CONNECT: string;
  readonly VITE_ALCHEMY_API_KEY: string;
  readonly VITE_PAYFLOW_SERVICE_API_URL: string;
  readonly VITE_PAYFLOW_SERVICE_DAPP_URL: string;
  readonly VITE_ZKSYNC_MASTER_PAYFLOW_FACTORY_ADDRESS: `0x${string}`;
  readonly VITE_ZKSYNC_PAYFLOW_FACTORY_ADDRESS: `0x${string}`;
  readonly VITE_ACCOUNT_CREATE2_SALT_IV: string;
  readonly VITE_WEB3AUTH_PNP_CLIENT_ID: string;
  readonly VITE_WEB3AUTH_TORUS_API_KEY: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_GELATO_TESTNET_API_KEY: string;
  readonly VITE_GELATO_MAINNET_API_KEY: string;
  readonly VITE_AIRSTACK_API_KEY: string;
  readonly VITE_ENABLED_CHAINS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
