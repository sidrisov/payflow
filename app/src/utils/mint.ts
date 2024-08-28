import { readContract } from '@wagmi/core';
import axios from 'axios';
import { Address } from 'viem';
import { IdentityType } from '../types/ProfileType';
import { API_URL } from './urlConstants';
import { wagmiConfig } from './wagmiConfig';
import { zoraErc1155Abi } from './abi/zoraErc1155Abi';

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
  try {
    const collectionOwner = await fetchCollectionOwner(chainId, contract);
    const identityResponse = await axios.get(`${API_URL}/api/user/identities/${collectionOwner}`);
    const identity =
      identityResponse.data !== ''
        ? identityResponse.data
        : ({ address: collectionOwner } as IdentityType);

    const collectionName = tokenId
      ? (await fetchCollectionName(chainId, contract)).concat(` #${tokenId}`)
      : await fetchCollectionName(chainId, contract);

    const tokenMetadataUri = tokenId
      ? await fetchCollectionTokenMetadataURI(chainId, contract, tokenId)
      : null;

    const metadata = tokenMetadataUri ? await fetchTokenMetadata(tokenMetadataUri) : null;

    if (!metadata) {
      return;
    }

    return {
      provider,
      collectionName,
      metadata,
      identity
    };
  } catch (error) {
    console.error('Failed to fetch mint data:', error);
    return;
  }
}

export async function fetchCollectionOwner(chainId: number, contract: Address): Promise<string> {
  const owner = (await readContract(wagmiConfig, {
    chainId: chainId as any,
    address: contract,
    abi: zoraErc1155Abi,
    functionName: 'owner'
  })) as string;

  return owner;
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
  chainId: number,
  contract: Address,
  tokenId: number
): Promise<string> {
  return (await readContract(wagmiConfig, {
    chainId: chainId as any,
    address: contract,
    abi: zoraErc1155Abi,
    functionName: 'uri',
    args: [BigInt(tokenId)]
  })) as string;
}

export async function fetchTokenMetadata(metadataUri: string) {
  try {
    const resolvedMetadataUri = resolveIpfsUri(metadataUri);

    const metadataResponse = await axios.get(resolvedMetadataUri);
    const metadata = metadataResponse.data;
    const name = metadata.name;
    const imageUri = metadata.image;
    const resolvedImageUri = `https://media.decentralized-content.com/-/rs:fit:500:500/${btoa(
      resolveIpfsUri(imageUri)
    )}`;

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
