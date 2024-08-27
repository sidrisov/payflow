import { useQuery, UseQueryResult } from '@tanstack/react-query';
import axios from 'axios';

const DEGEN_API = 'https://api.degen.tips/airdrop2';

interface DegenAllowanceResponse {
  snapshot_day: string;
  fid: string;
  user_rank: string;
  tip_allowance: string;
  remaining_tip_allowance: string;
  wallet_addresses: string[];
}

interface DegenAllowanceData {
  snapshotDay: string;
  fid: string;
  userRank: string;
  tipAllowance: string;
  remainingTipAllowance: string;
  walletAddresses: string[];
}

export const useAllowance = (
  fid: number | undefined
): UseQueryResult<DegenAllowanceData | undefined, Error> => {
  return useQuery({
    enabled: Boolean(fid),
    queryKey: ['degen_allowance', fid],
    staleTime: Infinity,
    refetchInterval: 120_000,
    queryFn: async () => {
      return (
        await axios.get<DegenAllowanceResponse[]>(`${DEGEN_API}/allowances?fid=${fid}&limit=1`)
      ).data;
    },
    select: (data: DegenAllowanceResponse[]) => {
      if (data.length > 0) {
        const allowance = data[0];
        return {
          snapshotDay: allowance.snapshot_day,
          fid: allowance.fid,
          userRank: allowance.user_rank,
          tipAllowance: allowance.tip_allowance,
          remainingTipAllowance: allowance.remaining_tip_allowance,
          walletAddresses: allowance.wallet_addresses
        };
      }
    }
  });
};

export interface DegenPoints {
  fid: string;
  wallet_address: string;
  points: string;
  display_name: string;
  avatar_url: string;
  fname: string;
}

const fetchPointsForWallet = async (wallet: string): Promise<DegenPoints[]> => {
  try {
    const response = await axios.get(`${DEGEN_API}/current/points?wallet=${wallet}`);
    return response.data;
  } catch (error) {
    throw new Error('Error fetching points');
  }
};

export const usePoints = (
  wallets: string[] | undefined
): UseQueryResult<DegenPoints | undefined, Error> => {
  return useQuery({
    enabled: wallets && wallets.length > 0,
    queryKey: ['degen_points', wallets],
    queryFn: async () => {
      if (!wallets) {
        return;
      }
      for (const wallet of wallets) {
        const data = await fetchPointsForWallet(wallet);
        if (data.length > 0) {
          return data[0];
        }
      }
    }
  });
};
