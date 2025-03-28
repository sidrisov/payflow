import axios from 'axios';
import { getNetworkShortName } from './networks';

// Updated types to match the API response
type AlchemyNFTMetadata = {
  contract: {
    address: string;
    name: string;
    symbol: string;
    totalSupply: string;
    tokenType: string;
  };
  tokenId: string;
  tokenType: string;
  name: string;
  description: string;
  tokenUri: string;
  image: {
    cachedUrl: string;
    thumbnailUrl: string;
    pngUrl: string;
    contentType: string;
    size: number;
    originalUrl: string;
  };
};

export async function fetchNFTMetadata(
  chainId: string | number,
  contractAddress: string,
  tokenId: string | number,
  apiKey: string
): Promise<AlchemyNFTMetadata | null> {
  let network: string;
  if (typeof chainId === 'number') {
    const networkName = getNetworkShortName(chainId);
    if (!networkName) {
      console.error(`Unsupported chain ID: ${chainId}`);
      return null;
    }
    network = networkName;
  } else {
    network = chainId;
  }

  try {
    const baseUrl = `https://${network}-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTMetadata`;
    const params = new URLSearchParams({
      contractAddress,
      tokenId: tokenId.toString()
    });

    const response = await axios.get<AlchemyNFTMetadata>(`${baseUrl}?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching NFT metadata from Alchemy:', error);
    return null;
  }
}

// Keep the existing fetchNFTMetadataFromAlchemy function if you need to fetch multiple NFTs
