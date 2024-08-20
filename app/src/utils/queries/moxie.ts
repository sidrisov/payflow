import { useMutation, useQuery } from '@tanstack/react-query';

import { GraphQLClient } from 'graphql-request';
import {
  QUERY_CHECK_STATUS_CLAIM_MOXIE_REWARDS as QUERY_MOXIE_REWARDS_CLAIM_STATUS,
  QUERY_MOXIE_REWARDS,
  QUERY_CLAIM_MOXIE_REWARDS
} from '../airstackQueries';
import { Address } from 'viem';

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

const PENDING_STATUS = 'PENDING';

export const useMoxieRewardsClaimStatus = (
  fid: number | undefined,
  transactionId: string | undefined
) => {
  return useQuery({
    enabled: Boolean(fid && transactionId),
    queryKey: ['moxie_rewards_status', fid, transactionId],
    staleTime: Infinity,
    refetchInterval: 120_000,
    queryFn: async () => {
      const data = await graphQLClient.request<ClaimTransactionDetailsResponse>(
        QUERY_MOXIE_REWARDS_CLAIM_STATUS,
        { fid, transactionId },
        headers
      );

      // Retry if status is not SUCCESS
      if (data.FarcasterUserClaimTransactionDetails.transactionStatus !== 'SUCCESS') {
        throw new Error(PENDING_STATUS);
      }

      return data;
    },
    select(data: any) {
      return {
        status: data.FarcasterUserClaimTransactionDetails.transactionStatus,
        rewards: data.FarcasterUserClaimTransactionDetails.transactionAmount
      };
    },
    retry: (failureCount, error) => {
      if (error.message === PENDING_STATUS && failureCount < 5) {
        return true;
      }
      return false;
    },
    retryDelay: 3000
  });
};

type ClaimRewardsInput = {
  fid: number;
  preferredConnectedWallet: Address;
};

type ClaimRewardsResponse = {
  FarcasterUserClaimMoxie: {
    transactionId: string;
  };
};

type ClaimTransactionDetailsResponse = {
  FarcasterUserClaimTransactionDetails: {
    transactionStatus: string;
    transactionAmount: number;
  };
};

export const useClaimRewardsMutation = () => {
  return useMutation({
    mutationKey: ['claim_moxie_rewards'],
    mutationFn: async ({ fid, preferredConnectedWallet }: ClaimRewardsInput) => {
      try {
        const data = await graphQLClient.request<ClaimRewardsResponse>(
          QUERY_CLAIM_MOXIE_REWARDS,
          { fid, preferredConnectedWallet },
          headers
        );

        console.log('Fetched message');

        return data.FarcasterUserClaimMoxie;
      } catch (error: any) {
        const errorMessage = error.message.split(':')[0].trim();
        throw new Error(errorMessage);
      }
    }
  });
};
