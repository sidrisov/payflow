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

type MintPaymentResult = {
  paymentTx: MintPaymentTx;
  mintStatus: 'live' | 'ended' | 'error';
  secondary?: boolean;
};

async function fetchMintPaymentTx({
  mint,
  minter,
  recipient,
  comment,
  amount
}: {
  mint: MintMetadata;
  minter: Address;
  recipient: Address;
  comment?: string;
  amount: number;
}): Promise<MintPaymentResult> {
  try {
    if (mint.provider === 'zora.co') {
      const publicClient = getPublicClient(wagmiConfig, { chainId: mint.chainId });

      const collectorClient = createCollectorClient({
        chainId: mint.chainId,
        publicClient: publicClient as PublicClient
      });

      const secondaryInfo = await collectorClient.getSecondaryInfo({
        contract: mint.contract,
        tokenId: BigInt(mint.tokenId!)
      });

      console.log('SecondaryInfo: ', secondaryInfo);

      if (secondaryInfo?.secondaryActivated) {
        const { parameters, price, error } = await collectorClient.buy1155OnSecondary({
          // temp hack to overcome secondary restriction on having balance on the minter address
          account: '0x0dEe77c83cB8b14fA95497825dF93202AbF6ad83',
          contract: mint.contract,
          tokenId: BigInt(mint.tokenId!),
          quantity: BigInt(amount),
          recipient
        });

        console.log('Secondary buy1155OnSecondary: ', parameters, price, error);

        return {
          paymentTx: { ...parameters, minter, chainId: mint.chainId },
          mintStatus: 'live',
          secondary: true
        };
      }

      const { parameters } = await collectorClient.mint({
        minterAccount: minter,
        mintType: mint.mintType as any,
        quantityToMint: BigInt(amount),
        tokenContract: mint.contract,
        tokenId: mint.tokenId,
        mintReferral: mint.referral,
        mintRecipient: recipient,
        mintComment: comment
      });

      return {
        paymentTx: { ...parameters, chainId: mint.chainId },
        mintStatus: 'live',
        secondary: false
      };
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
          args: [saleTermsId, BigInt(amount), recipient, mint.referral ?? zeroAddress], // Update amount
          value: RODEO_MINT_PRICE * BigInt(amount)
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
  comment,
  amount
}: {
  mint: MintMetadata;
  minter: Address;
  recipient: Address | undefined;
  comment?: string;
  amount: number;
}) {
  return useQuery<MintPaymentResult, Error>({
    enabled: Boolean(mint) && Boolean(minter) && Boolean(recipient) && amount > 0,
    staleTime: Infinity,
    refetchInterval: 30_000,
    retry: false,
    queryKey: ['mintPaymentTx', mint, minter, recipient, comment, amount],
    queryFn: async () => {
      if (!recipient) throw new Error('Recipient not found');
      return fetchMintPaymentTx({ mint, minter, recipient, comment, amount });
    }
  });
}
