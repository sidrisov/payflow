import dotenv from 'dotenv';
dotenv.config();

export const API_URL = process.env.VITE_PAYFLOW_SERVICE_API_URL ?? 'https://api.payflow.me';

export const DAPP_URL = process.env.VITE_PAYFLOW_SERVICE_DAPP_URL ?? 'https://app.payflow.me';

export const FRAMES_URL =
  process.env.VITE_PAYFLOW_SERVICE_FRAMES_URL ?? 'https://frames.payflow.me';

console.log(API_URL, DAPP_URL, FRAMES_URL);

export const TIP_PAYFLOW_URL = API_URL + '/api/farcaster/frames/jar/payflow';

export const BUY_STORAGE_FRAME_VERSION = 'v4.2';
export const MINT_FRAME_VERSION = 'v1.0';
export const MINI_APP_LAUNCHER = 'v1.3';
export const DEGEN_CLAIM_LAUNCHER = 'v1.0';
export const BUY_FAN_FRAME_VERSION = 'v1.1';
export const BUY_HYPERSUB_FRAME_VERSION = 'v1.1';
