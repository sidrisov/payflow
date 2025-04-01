import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../urlConstants';
import { IdentityType, ProfileType } from '@payflow/common';
import { sortAndFilterFlowWallets } from '../sortAndFilterFlows';

export const useProfile = (addressOrName: string | undefined) => {
  return useQuery({
    enabled: Boolean(addressOrName),
    queryKey: ['profile', { addressOrName }],
    staleTime: Infinity,
    queryFn: () =>
      axios.get(`${API_URL}/api/user/${addressOrName}`).then((res) => {
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

export const useIdentity = (addressOrName?: string, fid?: string) => {
  // Prioritize fid if both are passed
  const identity = fid ?? addressOrName;
  const isFidQuery = Boolean(fid);

  return useQuery({
    enabled: Boolean(identity),
    queryKey: ['identity', { identity, isFidQuery }],
    staleTime: Infinity,
    queryFn: () =>
      axios
        .get(`${API_URL}/api/user/identities/${isFidQuery ? 'fid/' : ''}${identity}`)
        .then((res) => {
          const identity = res.data as IdentityType;
          const defaultFlow = identity?.profile?.defaultFlow
            ? sortAndFilterFlowWallets(identity.profile.defaultFlow)
            : undefined;
          return {
            ...identity,
            ...(identity.profile && {
              profile: {
                ...identity.profile,
                defaultFlow
              }
            })
          } as IdentityType;
        })
  });
};
