export interface PaymentType {
  chainId?: number;
  token?: string;
  tokenAmount?: string;
  usdAmount?: string;
  status?: 'success' | 'failed';
}
