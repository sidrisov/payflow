import { useQuery } from '@tanstack/react-query';
import { Address } from 'viem';
import { PaymentType } from '../../types/PaymentType';
import { fetchMintData, MintMetadata } from '../mint';

type ParsedMintData = {
  provider: string;
  contract: Address;
  tokenId?: number;
};

function parseMintToken(token: string): ParsedMintData {
  const [provider, contract, tokenId] = token.split(':');
  return {
    provider,
    contract: contract as Address,
    tokenId: tokenId ? parseInt(tokenId) : undefined
  };
}

export function useMintData(payment: PaymentType) {
  const fetchData = async (): Promise<MintMetadata | null> => {
    if (!payment || payment.category !== 'mint') return null;
    const parsedMintData = parseMintToken(payment.token);
    return (
      (await fetchMintData(
        parsedMintData.provider,
        payment.chainId,
        parsedMintData.contract,
        parsedMintData.tokenId
      )) ?? null
    );
  };

  const { data: mintData, isLoading } = useQuery<MintMetadata | null>({
    queryKey: ['mintData', payment?.token, payment?.chainId],
    queryFn: fetchData,
    enabled: !!payment
  });

  return { mintData, loading: isLoading };
}
