import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BaseNameReponseType } from '../../types/BaseNameType';

export const useBaseName = (address: string | undefined, enabled: boolean) => {
  return useQuery({
    enabled: enabled && Boolean(address),
    queryKey: ['baseName', { address }],
    staleTime: Infinity,
    queryFn: () =>
      axios.get(`https://resolver-api.basename.app/v1/addresses/${address}`).then((res) => {
        console.log('hello', res);
        const baseName = res.data as BaseNameReponseType;

        return baseName.name;
      })
  });
};
