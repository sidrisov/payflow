import { useQuery } from '@tanstack/react-query';

import { GraphQLClient } from 'graphql-request';
import { QUERY_MOXIE_REWARDS } from '../airstackQueries';

const headers = {
  'x-airstack-claims': import.meta.env.VITE_AIRSTACK_API_KEY
};

const graphQLClient = new GraphQLClient('https://claims.airstack.xyz/moxie');

export const useAvailableMoxieRewards = (fid: number | undefined) => {
  return useQuery({
    enabled: Boolean(fid),
    queryKey: ['moxie_rewards', fid],
    staleTime: Infinity,
    refetchInterval: 120_000,
    queryFn: async () => graphQLClient.request(QUERY_MOXIE_REWARDS, { fid }, headers),
    select(data: any) {
      return data.FarcasterUserClaimTransactionDetails.availableClaimAmount;
    }
  });
};
