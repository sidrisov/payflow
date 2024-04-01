import type { PageContextServer } from 'vike/types';
import axios from 'axios';
import { API_URL } from '../../../utils/constants';

export type Data = Awaited<ReturnType<typeof data>>;

export const data = async (pageContext: PageContextServer) => {
  const response = await axios.get(`${API_URL}/api/payment/${pageContext.routeParams.refId}`);
  return response.data;
};
