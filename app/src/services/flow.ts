import axios from 'axios';
import { API_URL } from '../utils/urlConstants';
import { FlowWalletType } from '../types/FlowType';

export default async function saveFlow(flow: {}): Promise<boolean | undefined> {
  try {
    const response = await axios.post(`${API_URL}/api/flows`, flow, { withCredentials: true });
    return response.status === 201;
  } catch (error) {
    console.log(error);
  }
}

export async function updateWallet(
  flowUuid: string,
  wallet: FlowWalletType
): Promise<boolean | undefined> {
  try {
    const response = await axios.put(`${API_URL}/api/flows/${flowUuid}/wallet`, wallet, {
      withCredentials: true
    });
    console.debug(response.status);

    return response.status === 200;
  } catch (error) {
    console.error(error);
  }
}
