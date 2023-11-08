import axios from 'axios';
import { API_URL } from '../utils/urlConstants';

export default async function saveFlow(flow: {}): Promise<boolean | undefined> {
  try {
    const response = await axios.post(`${API_URL}/api/flows`, flow, { withCredentials: true });
    return response.status === 201;
  } catch (error) {
    console.log(error);
  }
}
