import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../urlConstants';
import { ProfileType } from '../../types/ProfleType';
import { sortAndFilterFlowWallets } from '../sortAndFilterFlows';

export const useProfile = (addressOrName: string | undefined) => {
  return useQuery({
    enabled: Boolean(addressOrName),
    queryKey: ['profile', { addressOrName }],
    staleTime: Infinity,
    queryFn: () =>
      axios
        .get(`${API_URL}/api/user/${addressOrName}`, {
          withCredentials: true
        })
        .then((res) => {
          const profile = res.data as ProfileType;
          const defaultFlow = profile.defaultFlow
            ? sortAndFilterFlowWallets(profile.defaultFlow)
            : undefined;
          return {
            ...profile,
            defaultFlow
          };
        })
  });
};
