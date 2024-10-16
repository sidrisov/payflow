import { PaymentType } from '../types/PaymentType';
import { getNetworkDefaultBlockExplorerUrl } from './networks';

export function getReceiptUrl(
  payment: PaymentType,
  fulfillment: boolean,
  refund?: boolean
): string {
  return `${getNetworkDefaultBlockExplorerUrl(
    (fulfillment || refund) && payment.fulfillmentChainId
      ? payment.fulfillmentChainId
      : payment.chainId
  )}/tx/${fulfillment ? payment.fulfillmentHash : refund ? payment.refundHash : payment.hash}`;
}
