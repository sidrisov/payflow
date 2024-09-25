import dotenv from 'dotenv';
dotenv.config();

export const API_URL =
  import.meta.env.VITE_PAYFLOW_SERVICE_API_URL ??
  process.env.VITE_PAYFLOW_SERVICE_API_URL ??
  'https://api.alpha.payflow.me';
export const DAPP_URL =
  import.meta.env.VITE_PAYFLOW_SERVICE_DAPP_URL ??
  process.env.VITE_PAYFLOW_SERVICE_DAPP_URL ??
  'https://app.payflow.me';
export const FRAMES_URL =
  import.meta.env.VITE_PAYFLOW_SERVICE_DAPP_URL ??
  process.env.VITE_PAYFLOW_SERVICE_FRAMES_URL ??
  import.meta.env.VITE_PAYFLOW_SERVICE_FRAMES_URL ??
  'https://frames.payflow.me';

console.log(API_URL, DAPP_URL, FRAMES_URL);

export const TIP_PAYFLOW_URL = API_URL + '/api/farcaster/frames/jar/payflow';

export const BUY_STORAGE_FRAME_VERSION = 'v3.8';
export const MINT_FRAME_VERSION = 'v1.0';
