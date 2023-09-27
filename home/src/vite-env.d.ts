/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
interface ImportMetaEnv {
  readonly VITE_PAYFLOW_SERVICE_DAPP_URL: string;
  readonly VITE_PAYFLOW_SERVICE_DOCS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
