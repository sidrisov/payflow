import { chainId } from 'permissionless';
import { PaymentType } from '../types/PaymentType';
import { getNetworkDefaultBlockExplorerUrl } from './networks';

export function getReceiptUrl(payment: PaymentType, fulfillment: boolean): string {
  let baseUrl;

  return `${getNetworkDefaultBlockExplorerUrl(payment.chainId)}/tx/${
    fulfillment ? payment.fulfillmentHash : payment.hash
  }`;
}
