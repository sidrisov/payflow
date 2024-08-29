import { useQuery, UseQueryResult } from '@tanstack/react-query';
import axios from 'axios';
import { Address } from 'viem';
import { base, degen } from 'viem/chains';

const DEGEN_API = 'https://api.degen.tips/airdrop2';
export type DegenClaimSeason = {
  id: string;
  name: string;
  chainId: number;
  contract?: Address;
};

export const DEGEN_CLAIM_SEASONS: DegenClaimSeason[] = [
  {
    id: 'season1',
    name: 'Season 1',
    chainId: base.id
  },
  {
    id: 'season2',
    name: 'Season 2',
    chainId: base.id
  },
  {
    id: 'season3',
    name: 'Season 3',
    chainId: base.id
  },
  {
    id: 'season4',
    name: 'Season 4',
    chainId: base.id
  },
  {
    id: 'season5',
    name: 'Season 5',
    chainId: base.id,
    contract: '0x81ac315d7baf7fae2e8278dc33ec91b752560166'
  },
  {
    id: 'season6',
    name: 'Season 6',
    chainId: base.id,
    contract: '0xdfeddda2bC2e75524f470991f46404eE90ae2eEa'
  },
  { id: 'season7', name: 'Season 7', chainId: degen.id },
  { id: 'current', name: 'New Season', chainId: degen.id }
];

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

const fetchPointsForWallet = async (wallet: Address, season: string): Promise<DegenPoints[]> => {
  try {
    const response = await axios.get(`${DEGEN_API}/${season}/points?wallet=${wallet}`);
    return response.data;
  } catch (error) {
    throw new Error('Error fetching points');
  }
};

export const usePoints = (
  wallets: Address[] | undefined,
  seasonId: string
): UseQueryResult<DegenPoints | undefined, Error> => {
  return useQuery({
    enabled: Boolean(wallets && seasonId),
    queryKey: ['degen_points', wallets, seasonId],
    staleTime: Infinity,
    refetchInterval: 120_000,
    retry: false,
    queryFn: async () => {
      if (!wallets || wallets.length === 0 || !seasonId) {
        return null;
      }

      for (const wallet of wallets) {
        const data = await fetchPointsForWallet(wallet, seasonId);
        if (data.length > 0) {
          return data[0];
        }
      }
      return null;
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
  wallet: Address | undefined,
  seasonId: string
): UseQueryResult<DegenMerkleProofs | undefined, Error> => {
  return useQuery({
    enabled: Boolean(wallet),
    queryKey: ['degen_merkle_proofs', wallet, seasonId],
    staleTime: Infinity,
    refetchInterval: 120_000,
    retry: false,
    queryFn: async () => {
      return (
        await axios.get<DegenMerkleProofs[]>(
          `${DEGEN_API}/${seasonId}/merkleproofs?wallet=${wallet}`
        )
      ).data;
    },
    select: (data: DegenMerkleProofs[]) => {
      if (data.length > 0) {
        return data[0];
      }
    }
  });
};
