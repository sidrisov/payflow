import axios from 'axios';
import { PaymentType } from '../types/PaymentType';
import { API_URL } from '../utils/urlConstants';

export async function completePayment(payment: PaymentType): Promise<boolean | undefined> {
  try {
    const response = await axios.put(
      `${API_URL}/api/payment/${payment.referenceId}`,
      { hash: payment.hash },
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
