import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../urlConstants';
import { IdentityType } from '../../types/ProfleType';
import { sortBySocialScore } from '../../services/socials';

export const useContacts = (enabled: boolean) => {
  return useQuery({
    enabled,
    queryKey: ['contacts'],
    staleTime: Infinity,
    queryFn: () =>
      axios
        .get(`${API_URL}/api/user/me/contacts`, {
          withCredentials: true
        })
        .then((res) => {
          const contacts = sortBySocialScore(res.data as IdentityType[]);
          console.log('Fetched contacts: ', contacts);
          return contacts;
        })
  });
};
