import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../urlConstants';
import { ContactsResponseType } from '@payflow/common';
import { sortBySocialScore } from '../../services/socials';

export const useContacts = ({
  enabled,
  accessToken
}: {
  enabled: boolean;
  accessToken?: string;
}) => {
  const query = useQuery({
    enabled,
    queryKey: ['contacts'],
    staleTime: Infinity,
    queryFn: () =>
      axios
        .get(
          `${API_URL}/api/user/me/contacts${accessToken ? '?access_token=' + accessToken : ''}`,
          {
            headers: { 'Cache-Control': 'max-age=10' },
            withCredentials: true
          }
        )
        .then((res) => {
          const response = res.data;
          console.log('Fetched contacts:', response);

          return {
            tags: response.tags as string[],
            contacts: sortBySocialScore(response.contacts)
          } as ContactsResponseType;
        })
  });

  return {
    ...query,
    refetch: () => query.refetch()
  };
};
