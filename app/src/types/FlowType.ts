export interface FlowType {
  account: `0x${string}`;
  title: string;
  description: string;
  uuid: string;
  wallets: FlowWalletType[];
}

export interface FlowWalletType {
  address: `0x${string}`;
  network: string;
}
