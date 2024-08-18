import { readContract } from '@wagmi/core';
import { Address } from 'viem';
import { wagmiConfig } from './wagmi';
import { zoraErc1155Abi } from './abis';
import axios from 'axios';

export async function fetchCollectionOwner(chain: string, contract: Address): Promise<string> {
  const chainId = wagmiConfig.chains.find((c) => c.name.toLowerCase().includes(chain))?.id;
  const owner = (await readContract(wagmiConfig, {
    chainId,
    address: contract,
    abi: zoraErc1155Abi,
    functionName: 'owner'
  })) as string;

  return owner;
}

export async function fetchCollectionName(chain: string, contract: Address): Promise<string> {
  const chainId = wagmiConfig.chains.find((c) => c.name.toLowerCase().includes(chain))?.id;
  const contractURI = resolveIpfsUri(
    (await readContract(wagmiConfig, {
      chainId,
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
  chain: string,
  contract: Address,
  tokenId: number
): Promise<string> {
  const chainId = wagmiConfig.chains.find((c) => c.name.toLowerCase().includes(chain))?.id;
  return (await readContract(wagmiConfig, {
    chainId,
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
    const resolvedImageUri = `https://media.decentralized-content.com/-/rs:fit:500:500/${btoa(resolveIpfsUri(imageUri))}`;

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
