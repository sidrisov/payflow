import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Social } from '@/generated/graphql/types';
import {
  QUERY_FARCASTER_CHANNELS_FOR_USER,
  QUERY_FARCASTER_CHANNELS_FOR_CHANNEL_ID
} from '@/utils/airstackQueries';
import { ChannelType } from '@/components/dialogs/ChannelSelector';
import { API_URL } from '../urlConstants';

const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';
const AIRSTACK_API_KEY = import.meta.env.VITE_AIRSTACK_API_KEY;

export async function fetchFarcasterUser(
  query: string,
  variables: { fid?: string; identity?: string }
): Promise<Social | undefined> {
  const { data } = await axios.post(
    'https://api.airstack.xyz/gql',
    {
      query,
      variables
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_AIRSTACK_API_KEY
      },
      validateStatus: (status) => status >= 200 && status < 300
    }
  );

  return data.data.Socials?.Social?.[0];
}

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

async function fetchModeratedChannels(identity: string) {
  const { data } = await axios.post(
    AIRSTACK_API_URL,
    {
      query: QUERY_FARCASTER_CHANNELS_FOR_USER,
      variables: { identity }
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AIRSTACK_API_KEY
      }
    }
  );

  return data.data?.FarcasterChannels?.FarcasterChannel || [];
}

async function fetchSearchedChannels(channelId: string): Promise<ChannelType[]> {
  const { data } = await axios.post(
    AIRSTACK_API_URL,
    {
      query: QUERY_FARCASTER_CHANNELS_FOR_CHANNEL_ID,
      variables: { channelId: `^${channelId}` }
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AIRSTACK_API_KEY
      }
    }
  );

  return data.data?.FarcasterChannels?.FarcasterChannel || [];
}

export function useModeratedChannels(userIdentity: string) {
  return useQuery<ChannelType[]>({
    queryKey: ['moderatedChannels', userIdentity],
    queryFn: () => fetchModeratedChannels(userIdentity),
    enabled: Boolean(userIdentity),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });
}

export function useSearchChannels() {
  return useMutation({
    mutationFn: (searchTerm: string) => fetchSearchedChannels(searchTerm)
  });
}
