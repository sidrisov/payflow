export interface PaymentType {
  chainId?: number;
  token?: string;
  amount?: string;
  usdAmount?: string;
  status?: 'success' | 'failed';
}
