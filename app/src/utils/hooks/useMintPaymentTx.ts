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
import { HIGHLIGHT_MINT_MANAGER_ADDRS, RODEO_MINT_CONTRACT_ADDR } from '../contracts';
import { MintMetadata } from '../mint';
import { wagmiConfig } from '../wagmiConfig';
import { GraphQLClient, gql } from 'graphql-request'; // Import GraphQL client
import { highlightMintManagerAbi } from '../abi/highlightMintManagerAbi';

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
  mintStatus: 'live' | 'ended' | 'upcoming' | 'sold';
  paymentTx?: MintPaymentTx;
  secondary?: boolean;
};

const GET_COLLECTION_SALE_DETAILS = `
  query GetCollectionSaleDetails($collectionId: String!) {
    getPublicCollectionDetails(collectionId: $collectionId) {
      id
      size
      supply
      edition(withDetails: true, withProperties: false) {
        size
        onChainMetadata
        remainingSupply
      }
      mintVectors {
        id
        name
        collectorMessage
        start
        end
        paused
        maxPerUser
        maxPerVector
        price
        currency
        chainId
        gateId
        ethRate
        sponsored
        sponsoredLatestErrorTimestamp
        mintVectorStats(getUserStats: true, getEarned: true) {
          total
          sold
          status
          claimedByCurrentUser
          earned
          dutchAuctionRebateWei
          onchainDutchAuctionStats {
            inFPP
            exhausted
          }
        }
        chain {
          id
          mintFee
        }
        paymentCurrency {
          address
          decimals
          symbol
          type
          mintFee
        }
        priceDrops {
          price
          end
          active
        }
        priceType
        scheduledPrices
        priceDropInterval {
          unit
          value
        }
        isDirectMint
        onchainMintVectorId
        consumerData {
          id
          type
        }
      }
    }
  }
`;

class MintPaymentError extends Error {
  constructor(message: string, public provider: string, public originalError?: any) {
    super(message);
    this.name = 'MintPaymentError';
  }
}

function handleError(error: any, provider: string): never {
  console.error(`Error in ${provider} case:`, error);
  if (error instanceof MintPaymentError) throw error;
  throw new MintPaymentError(`Error fetching ${provider} payment information`, provider, error);
}

// Define TypeScript types for the GraphQL response
interface MintVector {
  id: string;
  name: string;
  collectorMessage: string;
  start: string;
  end: string | null;
  paused: boolean;
  maxPerUser: number;
  maxPerVector: number;
  price: string;
  currency: string;
  chainId: number;
  gateId: string;
  ethRate: string;
  sponsored: boolean;
  sponsoredLatestErrorTimestamp: string;
  mintVectorStats: {
    total: number;
    sold: number;
    status: string;
    claimedByCurrentUser: number;
    earned: string;
    dutchAuctionRebateWei: string;
    onchainDutchAuctionStats: {
      inFPP: boolean;
      exhausted: boolean;
    };
  };
  chain: {
    id: number;
    mintFee: string;
  };
  paymentCurrency: {
    address: string;
    decimals: number;
    symbol: string;
    type: string;
    mintFee: string;
  };
  priceDrops: {
    price: string;
    end: string;
    active: boolean;
  }[];
  priceType: string;
  scheduledPrices: string[];
  priceDropInterval: {
    unit: string;
    value: number;
  };
  isDirectMint: boolean;
  onchainMintVectorId: string;
  consumerData: {
    id: string;
    type: string;
  };
}

interface Edition {
  size: number;
  onChainMetadata: string;
  remainingSupply: number;
}

interface PublicCollectionDetails {
  id: string;
  size: number;
  supply: number;
  edition: Edition;
  mintVectors: MintVector[];
}

interface GetCollectionSaleDetailsResponse {
  getPublicCollectionDetails: PublicCollectionDetails;
}

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
    switch (mint.provider) {
      case 'zora.co': {
        try {
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
        } catch (error: any) {
          handleError(error, mint.provider);
        }
      }
      case 'rodeo.club': {
        try {
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
              args: [saleTermsId, BigInt(amount), recipient, mint.referral ?? zeroAddress],
              value: RODEO_MINT_PRICE * BigInt(amount)
            },
            mintStatus: 'live'
          };
        } catch (error: any) {
          handleError(error, mint.provider);
        }
      }
      case 'highlight.xyz': {
        try {
          const mintManagerAddress = HIGHLIGHT_MINT_MANAGER_ADDRS[mint.chainId];
          if (!mintManagerAddress) {
            throw new MintPaymentError('Minting not supported on this chain', mint.provider);
          }

          const graphQLClient = new GraphQLClient('https://api.highlight.xyz:8080');
          const variables = { collectionId: `${mint.chainId}:${mint.contract}` };
          const collectionSaleDetails: GetCollectionSaleDetailsResponse =
            await graphQLClient.request(GET_COLLECTION_SALE_DETAILS, variables);

          console.log('Fetched vector information:', collectionSaleDetails);

          const mintVector = collectionSaleDetails.getPublicCollectionDetails.mintVectors[0];
          const start = new Date(mintVector.start);
          const end = mintVector.end ? new Date(mintVector.end) : null;

          let mintStatus: 'live' | 'upcoming' | 'ended' | 'sold';
          const now = new Date();
          if (
            mintVector.mintVectorStats.total !== 0 &&
            mintVector.mintVectorStats.sold >= mintVector.mintVectorStats.total
          ) {
            mintStatus = 'sold';
          } else if (now < start) {
            mintStatus = 'upcoming';
          } else if (end && now > end) {
            mintStatus = 'ended';
          } else {
            mintStatus = 'live';
          }

          if (mintStatus !== 'live') {
            return {
              mintStatus
            };
          }

          const price = parseEther(mintVector.price);
          const fee = parseEther(mintVector.chain.mintFee);
          const vectorId = mintVector.onchainMintVectorId.split(':')[2];

          return {
            paymentTx: {
              chainId: mint.chainId,
              address: mintManagerAddress,
              abi: highlightMintManagerAbi as Abi,
              functionName: 'vectorMint721',
              args: [vectorId, BigInt(amount), recipient],
              value: (price + fee) * BigInt(amount)
            },
            mintStatus
          };
        } catch (error: any) {
          handleError(error, mint.provider);
        }
      }
      default:
        throw new MintPaymentError('Unsupported mint provider', mint.provider);
    }
  } catch (error: any) {
    handleError(error, mint.provider);
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
