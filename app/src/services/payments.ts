import axios from 'axios';
import { PaymentType } from '../types/PaymentType';
import { API_URL } from '../utils/urlConstants';

export async function completePayment(payment: PaymentType): Promise<boolean | undefined> {
  try {
    const response = await axios.put(
      `${API_URL}/api/payment/${payment.referenceId}`,
      {
        chainId: payment.chainId,
        token: payment.token,
        hash: payment.hash,
        fulfillmentId: payment.fulfillmentId,
        fulfillmentChainId: payment.fulfillmentChainId,
        fulfillmentHash: payment.fulfillmentHash
      },
      {
        withCredentials: true
      }
    );
    console.debug(response.status);

    return response.status === 200;
  } catch (error) {
    console.error(error);
  }
}

export async function fetchPayment(paymentRefId: string): Promise<PaymentType | undefined> {
  try {
    const response = await axios.get(`${API_URL}/api/payment/${paymentRefId}`, {
      withCredentials: true
    });
    console.debug(response.status);

    return response.data as PaymentType;
  } catch (error) {
    console.error(error);
  }
}

export async function submitPayment(
  payment: PaymentType,
  accessToken?: string
): Promise<string | undefined> {
  try {
    const response = await axios.post(
      `${API_URL}/api/payment${accessToken ? '?access_token=' + accessToken : ''}`,
      payment,
      {
        withCredentials: true
      }
    );
    console.debug(response.status);

    return response.data.referenceId;
  } catch (error) {
    console.error(error);
  }
}

export async function cancelPayment(payment: PaymentType): Promise<boolean | undefined> {
  try {
    const response = await axios.put(
      `${API_URL}/api/payment/${payment.referenceId}/cancel`,
      {},
      {
        withCredentials: true
      }
    );
    console.debug(response.status);

    return response.status === 200;
  } catch (error) {
    console.error(error);
  }
}
