import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../urlConstants';
import { ContactWithFanTokenAuction } from '../../types/ProfleType';

export const useFanTokens = ({ enabled }: { enabled: boolean }) => {
  return useQuery({
    enabled,
    queryKey: ['fan-tokens'],
    staleTime: Infinity,
    queryFn: () =>
      axios
        .get(`${API_URL}/api/info/farcaster/moxie/auctions`, {
          withCredentials: true
        })
        .then((res) => {
          const response = res.data;
          console.log('Fetched fan token auctions', response);
          return response as ContactWithFanTokenAuction[];
        })
  });
};
