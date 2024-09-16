import { useQuery } from '@airstack/airstack-react';
import { Social } from '../../generated/graphql/types';
import { QUERY_FARCASTER_PROFILE, QUERY_FARCASTER_PROFILE_BY_IDENTITY } from '../airstackQueries';

export function useSocialData(fid?: string, address?: string) {
  const query = fid ? QUERY_FARCASTER_PROFILE : QUERY_FARCASTER_PROFILE_BY_IDENTITY;
  const variables = fid ? { fid: fid.toString() } : { identity: address };

  const { data, loading } = useQuery<Social>(query, variables, {
    cache: true,
    dataFormatter(data) {
      return data.Socials.Social[0];
    }
  });

  return {
    social: data,
    loading
  };
}
