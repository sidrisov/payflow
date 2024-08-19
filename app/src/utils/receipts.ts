import { PaymentType } from '../types/PaymentType';
import { getNetworkDefaultBlockExplorerUrl } from './networks';

export function getReceiptUrl(payment: PaymentType, fulfillment: boolean): string {
  return `${getNetworkDefaultBlockExplorerUrl(
    fulfillment && payment.fulfillmentChainId ? payment.fulfillmentChainId : payment.chainId
  )}/tx/${fulfillment ? payment.fulfillmentHash : payment.hash}`;
}
