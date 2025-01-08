import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../urlConstants';
import { ContactWithFanTokenAuction } from '@payflow/common';

export const useFanTokens = ({
  enabled,
  accessToken
}: {
  enabled: boolean;
  accessToken?: string;
}) => {
  return useQuery({
    enabled,
    queryKey: ['fan-tokens'],
    staleTime: Infinity,
    queryFn: () =>
      axios
        .get(
          `${API_URL}/api/info/farcaster/moxie/auctions${
            accessToken ? '?access_token=' + accessToken : ''
          }`,
          {
            withCredentials: true
          }
        )
        .then((res) => {
          const response = res.data;
          console.log('Fetched fan token auctions', response);
          return response as ContactWithFanTokenAuction[];
        })
  });
};
