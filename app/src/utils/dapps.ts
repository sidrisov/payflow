export const XMPT_DAPP = 'xmtp';
export const ENS_DAPP = 'ens';
export const FARCASTER_DAPP = 'farcaster';
export const LENS_DAPP = 'lens';
export const ADDRESS = 'address';

export type dAppType =
  | typeof XMPT_DAPP
  | typeof ENS_DAPP
  | typeof FARCASTER_DAPP
  | typeof LENS_DAPP
  | typeof ADDRESS;
