import axios from 'axios';
import { FlowType } from '../types/FlowType';

export default async function saveFlow(flow: {}): Promise<boolean | undefined> {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_PAYFLOW_SERVICE_API_URL}/api/flows`,
      flow,
      { withCredentials: true }
    );
    return response.status === 201;
  } catch (error) {
    console.log(error);
  }
}
