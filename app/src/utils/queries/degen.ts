import { useQuery, UseQueryResult } from '@tanstack/react-query';
import axios from 'axios';
import { Address } from 'viem';

const DEGEN_API = 'https://api.degen.tips/airdrop2';

interface DegenAllowanceData {
  snapshot_day: string;
  fid: string;
  user_rank: string;
  tip_allowance: string;
  remaining_tip_allowance: string;
  wallet_addresses: Address[];
}

export const useAllowance = (
  fid: number | undefined
): UseQueryResult<DegenAllowanceData | undefined, Error> => {
  return useQuery({
    enabled: Boolean(fid),
    queryKey: ['degen_allowance', fid],
    staleTime: Infinity,
    refetchInterval: 120_000,
    retry: false,
    queryFn: async () => {
      return (await axios.get<DegenAllowanceData[]>(`${DEGEN_API}/allowances?fid=${fid}&limit=1`))
        .data;
    },
    select: (data: DegenAllowanceData[]) => {
      if (data.length > 0) {
        return data[0];
      }
    }
  });
};

export interface DegenPoints {
  fid: string;
  wallet_address: Address;
  points: string;
  display_name: string;
  avatar_url: string;
  fname: string;
}

const fetchPointsForWallet = async (wallet: Address): Promise<DegenPoints[]> => {
  try {
    const response = await axios.get(`${DEGEN_API}/current/points?wallet=${wallet}`);
    return response.data;
  } catch (error) {
    throw new Error('Error fetching points');
  }
};

export const usePoints = (
  wallets: Address[] | undefined
): UseQueryResult<DegenPoints | undefined, Error> => {
  return useQuery({
    enabled: Boolean(wallets),
    queryKey: ['degen_points', wallets],
    staleTime: Infinity,
    refetchInterval: 120_000,
    retry: false,
    queryFn: async () => {
      if (!wallets || wallets.length === 0) {
        return null;
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

interface DegenMerkleProofs {
  wallet_address: Address;
  index: number;
  amount: string;
  proof: string[];
  created_at: string;
  updated_at: string;
}

export const useMerkleProofs = (
  wallet: Address | undefined
): UseQueryResult<DegenMerkleProofs | undefined, Error> => {
  return useQuery({
    enabled: Boolean(wallet),
    queryKey: ['degen_merkle_proofs', wallet],
    staleTime: Infinity,
    refetchInterval: 120_000,
    retry: false,
    queryFn: async () => {
      return (
        await axios.get<DegenMerkleProofs[]>(`${DEGEN_API}/season7/merkleproofs?wallet=${wallet}`)
      ).data;
    },
    select: (data: DegenMerkleProofs[]) => {
      if (data.length > 0) {
        return data[0];
      }
    }
  });
};
