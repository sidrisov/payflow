import { readContract } from '@wagmi/core';
import { Address, erc721Abi } from 'viem';
import { wagmiConfig } from './wagmi';
import { zoraErc1155Abi } from './abis/zoraErc1155Abi';
import axios from 'axios';
import { IdentityType } from '../types/ProfleType';

import dotenv from 'dotenv';
import { fetchNFTMetadata } from './nft';
dotenv.config();

const API_URL = process.env.VITE_PAYFLOW_SERVICE_API_URL;
const ALCHEMY_API_KEY = process.env.VITE_ALCHEMY_API_KEY;

export interface MintUrlParams {
  provider: string;
  chainId: string;
  contract: Address;
  referral?: string;
  tokenId?: string;
}

export interface MintMetadata {
  provider: string;
  collectionName: string;
  metadata: {
    name: string;
    image: string;
  };
  identity: IdentityType;
}

export async function fetchMintData(
  provider: string,
  chainId: number,
  contract: Address,
  tokenId?: number
): Promise<MintMetadata | undefined> {
  const metadata = await fetchNFTMetadata(chainId, contract, tokenId ?? 1, ALCHEMY_API_KEY!);
  if (!metadata) {
    return;
  }

  //const mintType = provider === 'highlight.xyz' ? '721' : '1155';
  try {
    console.log(`Fetching collection owner for contract: ${contract}`);
    const collectionOwner = await fetchCollectionOwner(chainId, contract);
    console.log(`Collection owner: ${collectionOwner}`);

    console.log(`Fetching identity for collection owner: ${collectionOwner}`);
    const identityResponse = await axios.get(`${API_URL}/api/user/identities/${collectionOwner}`);
    console.log(`Identity response:`, identityResponse.data);

    const identity =
      identityResponse.data !== ''
        ? identityResponse.data
        : ({ address: collectionOwner } as IdentityType);
    console.log(`Resolved identity:`, identity);

    /* console.log(`Fetching collection name for contract: ${contract}`);
    const collectionName = tokenId
      ? (await fetchCollectionName(chainId, contract)).concat(` #${tokenId}`)
      : await fetchCollectionName(chainId, contract);
    console.log(`Collection name: ${collectionName}`);

    console.log(`Fetching token metadata URI for tokenId: ${tokenId}`);
    const tokenMetadataUri = await fetchCollectionTokenMetadataURI(
      mintType,
      chainId,
      contract,
      tokenId
    );
    console.log(`Token metadata URI: ${tokenMetadataUri}`);

    console.log(`Fetching token metadata from URI: ${tokenMetadataUri}`);
    const metadata = tokenMetadataUri ? await fetchTokenMetadata(tokenMetadataUri) : null;

    if (!metadata) {
      return;
    } */

    return {
      provider,
      collectionName: metadata.contract.name + (tokenId ? ` #${tokenId}` : ''),
      metadata: {
        name: metadata.name ?? '',
        image:
          tokenId || metadata.image.contentType === 'image/gif'
            ? metadata.image.thumbnailUrl
            : metadata.image.originalUrl
      },
      identity
    };
  } catch (error) {
    console.error('Failed to fetch mint data:', error);
    return;
  }
}

export async function fetchCollectionOwner(chainId: number, contract: Address): Promise<string> {
  return (await readContract(wagmiConfig, {
    chainId: chainId as any,
    address: contract,
    abi: zoraErc1155Abi,
    functionName: 'owner'
  })) as Address;
}

export async function fetchCollectionName(chainId: number, contract: Address): Promise<string> {
  const contractURI = resolveIpfsUri(
    (await readContract(wagmiConfig, {
      chainId: chainId as any,
      address: contract,
      abi: zoraErc1155Abi,
      functionName: 'contractURI'
    })) as string
  );

  const contractMetadataResponse = await axios.get(contractURI);
  const contractMetadata = contractMetadataResponse.data;
  return contractMetadata.name;
}

export async function fetchCollectionTokenMetadataURI(
  mintType: '721' | '1155',
  chainId: number,
  contract: Address,
  tokenId?: number
): Promise<string> {
  // TODO: instead pre-fetch tokenId the one to mint

  const abi = mintType === '721' ? erc721Abi : zoraErc1155Abi;

  let tokenIdSanitized: bigint;
  if (!tokenId) {
    tokenIdSanitized = (await readContract(wagmiConfig, {
      chainId: chainId as any,
      address: contract,
      abi,
      functionName: 'totalSupply'
    })) as bigint;
  } else {
    tokenIdSanitized = BigInt(tokenId);
  }

  const functionName = mintType === '721' ? 'tokenURI' : 'uri';
  return (await readContract(wagmiConfig, {
    chainId: chainId as any,
    address: contract,
    abi,
    functionName: functionName as any,
    args: [tokenIdSanitized]
  })) as string;
}

export async function fetchTokenMetadata(metadataUri: string) {
  try {
    const resolvedMetadataUri = resolveIpfsUri(metadataUri);

    const metadataResponse = await axios.get(resolvedMetadataUri);
    const metadata = metadataResponse.data;
    const name = metadata.name;
    const imageUri = metadata.image;
    const resolvedImageUri = `https://media.decentralized-content.com/-/rs:fit:600:600/${btoa(resolveIpfsUri(imageUri))}`;

    console.debug('Metadata:', metadata);
    console.debug('Image URL:', resolvedImageUri);

    return { name, image: resolvedImageUri };
  } catch (error) {
    console.error('Error fetching metadata or image:', error);
  }
}

function resolveIpfsUri(uri: string): string {
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', 'https://ipfs.decentralized-content.com/ipfs/');
  }
  return uri;
}
