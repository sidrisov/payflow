/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_PAYFLOW_SERVICE_API_URL: string;
  readonly VITE_PAYFLOW_SERVICE_DAPP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
