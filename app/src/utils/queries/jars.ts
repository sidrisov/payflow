import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../urlConstants';
import { JarType } from '@payflow/common';

export const useJar = (uuid: string | undefined) => {
  return useQuery({
    enabled: Boolean(uuid),
    queryKey: ['jar', { uuid }],
    staleTime: Infinity,
    queryFn: () =>
      axios.get(`${API_URL}/api/flows/jar/${uuid}`).then((res) => {
        return res.data as JarType;
      })
  });
};
