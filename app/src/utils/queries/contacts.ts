import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../urlConstants';
import { ContactsResponseType } from '../../types/ProfleType';
import { sortBySocialScore } from '../../services/socials';

export const useContacts = (enabled: boolean, bypassCache: boolean = false) => {
  return useQuery({
    enabled,
    queryKey: ['contacts'],
    staleTime: Infinity,
    queryFn: () =>
      axios
        .get(`${API_URL}/api/user/me/contacts`, {
          headers: { ...(bypassCache && { 'Cache-Control': 'no-cache' }) },
          withCredentials: true
        })
        .then((res) => {
          const response = res.data;
          console.log('Fetched contacts:', response);

          return {
            tags: response.tags as string[],
            contacts: sortBySocialScore(response.contacts)
          } as ContactsResponseType;
        })
  });
};
