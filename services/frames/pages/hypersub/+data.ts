import type { PageContextServer } from 'vike/types';
import { ContractState, fetchState } from '@withfabric/protocol-sdks/stpv2';
import { configureFabricSDK } from '@withfabric/protocol-sdks';
import { wagmiConfig } from '../../utils/wagmi';
import axios from 'axios';
import { Address } from 'viem';

interface ContractMetadata {
  image: string;
  external_link: string;
  description: string;
  name: string;
  mintConfig: {
    maxSupply: number;
    phases: Array<{
      tx: {
        method: string;
        params: Array<{
          abiType: string;
          kind?: string;
          name: string;
          value?: string;
        }>;
      };
      price: string;
      startTime: number;
      endTime: number;
    }>;
  };
}

export interface HypersubData {
  chainId: number;
  contractAddress: Address;
  state: ContractState;
  metadata: ContractMetadata | null;
}

export type Data = Awaited<ReturnType<typeof data>>;

export const data = async (pageContext: PageContextServer) => {
  const { ids } = pageContext.urlParsed.searchAll as {
    ids?: string[];
  };

  configureFabricSDK({ wagmiConfig });

  const fetchHypersubData = async (id: string) => {
    const [chainId, contractAddress] = id.split(':');
    console.debug('Fetching Hypersub metadata for', contractAddress, 'on chain', chainId);

    try {
      const state = await fetchState({
        contractAddress: contractAddress as `0x${string}`,
        chainId: parseInt(chainId)
      });

      let contractMetadata = null;
      if (state.contractURI) {
        try {
          const response = await axios.get(state.contractURI);
          contractMetadata = response.data;
          console.debug('Fetched contract metadata:', contractMetadata);
        } catch (error) {
          console.error('Error fetching contract metadata:', error);
        }
      }

      return {
        chainId: parseInt(chainId),
        contractAddress,
        state,
        metadata: contractMetadata
      };
    } catch (error) {
      console.error('Error fetching Hypersub metadata:', error);
      return null;
    }
  };

  let hypersubs: HypersubData[];

  if (ids && ids.length > 0) {
    // Fetch data for multiple contract addresses
    const promises = ids.map((id) => fetchHypersubData(id));
    hypersubs = (await Promise.all(promises)).filter((data): data is HypersubData => data !== null);
  } else {
    throw new Error('No IDs provided');
  }

  return hypersubs;
};
