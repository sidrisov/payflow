import axios from 'axios';
import { getNetworkShortName } from './networks';

export const SIMPLE_HASH_API_KEY = import.meta.env.VITE_SIMPLE_HASH_API_KEY;

// Update these types to match the response structure
type SimpleHashNFTMetadata = {
  nft_id: string;
  chain: string;
  contract_address: string;
  token_id: string;
  name: string;
  description: string | null;
  previews: {
    image_small_url: string;
    image_medium_url: string;
    image_large_url: string;
    image_opengraph_url: string;
    blurhash: string;
    predominant_color: string;
  };
  image_url: string;
  image_properties: {
    width: number;
    height: number;
    size: number;
    mime_type: string;
    exif_orientation: number;
  };
  collection: {
    name: string;
    description: string;
    image_url: string;
  };
  owners: Array<{
    owner_address: string;
    quantity: number;
    quantity_string: string;
    first_acquired_date: string;
    last_acquired_date: string;
  }>;
  // Add other fields as needed
};

type SimpleHashResponse = SimpleHashNFTMetadata; // The response is the NFT metadata itself

// Update the function
export async function fetchNFTMetadataFromSimpleHash(
  chainId: string | number,
  contractAddress: string,
  tokenId: number | undefined
): Promise<SimpleHashNFTMetadata | null> {
  const apiKey = import.meta.env.VITE_SIMPLE_HASH_API_KEY;
  if (!apiKey) {
    console.error('SimpleHash API key is not set');
    return null;
  }

  let chain: string;
  if (typeof chainId === 'number') {
    const networkShortName = getNetworkShortName(chainId);
    if (!networkShortName) {
      console.error(`Unsupported chain ID: ${chainId}`);
      return null;
    }
    chain = networkShortName;
  } else {
    chain = chainId;
  }

  try {
    const response = await axios.get<SimpleHashResponse>(
      `https://api.simplehash.com/api/v0/nfts/${chain}/${contractAddress}/${tokenId}`,
      {
        headers: {
          accept: 'application/json',
          'X-API-KEY': SIMPLE_HASH_API_KEY
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching NFT metadata from SimpleHash:', error);
    return null;
  }
}
