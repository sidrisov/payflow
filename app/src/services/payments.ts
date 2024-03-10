import axios from 'axios';
import { PaymentType } from '../types/PaymentType';
import { API_URL } from '../utils/urlConstants';

export async function updatePayment(payment: PaymentType): Promise<boolean | undefined> {
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
