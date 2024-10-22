import { useQuery } from '@tanstack/react-query';
import { Address } from 'viem';
import { PaymentType } from '../../types/PaymentType';
import {
  ContractState,
  fetchState,
} from '@withfabric/protocol-sdks/stpv2';
import axios from 'axios';

export interface ContractMetadata {
  image: string;
  external_link: string;
  description: string;
  name: string;
}

export interface HypersubData {
  chainId: number;
  contractAddress: Address;
  state: ContractState;
  metadata: ContractMetadata | null;
}

export async function fetchHypersubData(payment: PaymentType): Promise<HypersubData | null> {
  if (!payment || payment.category !== 'hypersub') return null;

  console.debug('Fetching Hypersub metadata for', payment.token, 'on chain', payment.chainId);

  try {
    const state = await fetchState({
      contractAddress: payment.token as Address,
      chainId: payment.chainId
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

    const data = {
      chainId: payment.chainId,
      contractAddress: payment.token as Address,
      state,
      metadata: contractMetadata
    };

    console.debug('Fetched Hypersub data:', data);

    return data;
  } catch (error) {
    console.error('Error fetching Hypersub metadata:', error);
    return null;
  }
}

export function useHypersubData(payment: PaymentType) {
  const { data: hypersubData, isLoading } = useQuery<HypersubData | null>({
    queryKey: ['hypersubData', payment?.token, payment?.chainId],
    queryFn: () => fetchHypersubData(payment),
    enabled: !!payment && payment.category === 'hypersub'
  });

  return { hypersubData, loading: isLoading };
}
