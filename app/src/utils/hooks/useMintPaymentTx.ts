import { useQuery } from '@tanstack/react-query';
import { createCollectorClient } from '@zoralabs/protocol-sdk';
import {
  Address,
  Abi,
  ContractFunctionName,
  ContractFunctionArgs,
  PublicClient,
  zeroAddress,
  parseEther
} from 'viem';
import { getPublicClient, readContract } from 'wagmi/actions';
import { rodeoMintAbi } from '../abi/rodeoMintAbi';
import { RODEO_MINT_CONTRACT_ADDR } from '../contracts';
import { MintMetadata } from '../mint';
import { wagmiConfig } from '../wagmiConfig';

type MintPaymentTx = {
  chainId: number;
  address: Address;
  abi: Abi;
  functionName: ContractFunctionName;
  args?: ContractFunctionArgs;
  value?: bigint;
};

const RODEO_MINT_PRICE = parseEther('0.0001');

async function fetchMintPaymentTx({
  mint,
  minter,
  recipient,
  comment
}: {
  mint: MintMetadata;
  minter: Address;
  recipient: Address;
  comment?: string;
}): Promise<{ paymentTx: MintPaymentTx; mintStatus: 'live' | 'ended' | 'error' }> {
  try {
    if (mint.provider === 'zora.co') {
      const publicClient = getPublicClient(wagmiConfig, { chainId: mint.chainId });

      const collectorClient = createCollectorClient({
        chainId: mint.chainId,
        publicClient: publicClient as PublicClient
      });

      const { parameters } = await collectorClient.mint({
        minterAccount: minter,
        mintType: mint.mintType as any,
        quantityToMint: 1,
        tokenContract: mint.contract,
        tokenId: mint.tokenId,
        mintReferral: mint.referral,
        mintRecipient: recipient,
        mintComment: comment
      });

      return { paymentTx: { ...parameters, chainId: mint.chainId }, mintStatus: 'live' };
    } else if (mint.provider === 'rodeo.club') {
      const saleTermsId = await readContract(wagmiConfig, {
        chainId: mint.chainId,
        address: RODEO_MINT_CONTRACT_ADDR,
        abi: rodeoMintAbi,
        functionName: 'getSaleTermsForToken',
        args: [mint.contract, mint.tokenId]
      });

      return {
        paymentTx: {
          chainId: mint.chainId,
          address: RODEO_MINT_CONTRACT_ADDR,
          abi: rodeoMintAbi as Abi,
          functionName: 'mintFromFixedPriceSale',
          args: [saleTermsId, 1n, recipient, mint.referral ?? zeroAddress],
          value: RODEO_MINT_PRICE
        },
        mintStatus: 'live'
      };
    } else {
      throw new Error('Unsupported mint provider');
    }
  } catch (error) {
    console.error('Error checking mint status or preparing mint transaction:', error);
    return { paymentTx: {} as MintPaymentTx, mintStatus: 'error' };
  }
}

export function useMintPaymentTx({
  mint,
  minter,
  recipient,
  comment
}: {
  mint: MintMetadata;
  minter: Address;
  recipient: Address | undefined;
  comment?: string;
}) {
  return useQuery<{ paymentTx: MintPaymentTx; mintStatus: 'live' | 'ended' | 'error' }, Error>({
    enabled: Boolean(mint) && Boolean(minter) && Boolean(recipient),
    staleTime: Infinity,
    refetchInterval: 30_000,
    retry: false,
    queryKey: ['mintPaymentTx', mint, minter, recipient, comment],
    queryFn: async () => {
      if (!recipient) throw new Error('Recipient not found');
      return fetchMintPaymentTx({ mint, minter, recipient, comment });
    }
  });
}

