import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../urlConstants';

export async function fetchSocialInfo(identity?: string) {
  const { data } = await axios.get(`${API_URL}/api/socials?identity=${identity}`, {
    headers: { 'Content-Type': 'application/json' },
    validateStatus: (status) => status >= 200 && status < 300
  });

  return data.social;
}

export function useSocialInfo(identity?: string) {
  return useQuery({
    queryKey: ['socialInfo', identity],
    queryFn: () => fetchSocialInfo(identity),
    enabled: Boolean(identity),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000
  });
}
