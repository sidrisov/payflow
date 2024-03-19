import type { PageContextServer } from 'vike/types';
import axios from 'axios';
import { JarType } from '../../../types/FlowType';
import { API_URL } from '../../../utils/constants';

export type Data = Awaited<ReturnType<typeof data>>;

export const data = async (pageContext: PageContextServer) => {
  const response = await axios.get(`${API_URL}/api/flows/jar/${pageContext.routeParams.uuid}`);
  return response.data as JarType;
};
