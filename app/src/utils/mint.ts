import { readContract } from '@wagmi/core';
import axios from 'axios';
import { Address, erc721Abi, PublicClient } from 'viem';
import { IdentityType, SocialInfoType } from '@payflow/common';
import { API_URL, DAPP_URL } from './urlConstants';
import { wagmiConfig } from './wagmiConfig';
import { zoraErc1155Abi } from './abi/zoraErc1155Abi';
import { createCollectorClient } from '@zoralabs/protocol-sdk';
import { getPublicClient } from 'wagmi/actions';
import { ProfileType } from '@payflow/common';
import { FARCASTER_DAPP } from './dapps';
import { fetchNFTMetadata } from './nft';

export const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;

type ParsedMintData = {
  provider: MintProvider;
  contract: Address;
  tokenId?: number;
  referral?: Address;
  author?: Address;
};
export type MintProvider = 'zora.co' | 'rodeo.club' | 'highlight.xyz';

export type MintProviderName = 'Zora' | 'Rodeo' | 'Highlight';

export const mintProviderNameMap: { [key in MintProvider]: MintProviderName } = {
  'zora.co': 'Zora',
  'rodeo.club': 'Rodeo',
  'highlight.xyz': 'Highlight'
};

export type MintMetadata = {
  provider: MintProvider;
  chainId: number;
  contract: Address;
  tokenId?: number;
  owner: IdentityType;
  referral?: Address;
  collectionName: string;
  metadata: {
    name: string;
    description: string;
    image: string;
  };
  salesStatus?: 'live' | 'ended';
  mintType: '721' | '1155' | 'premint';
};

export async function fetchMintData(
  provider: MintProvider,
  chainId: number,
  contract: Address,
  tokenId?: number,
  referral?: Address
): Promise<MintMetadata | undefined> {
  const metadata = await fetchNFTMetadata(chainId, contract, tokenId ?? 1, ALCHEMY_API_KEY);
  if (!metadata) {
    return;
  }

  try {
    if (provider === 'zora.co') {
      const publicClient = getPublicClient(wagmiConfig, { chainId });

      const collectorClient = createCollectorClient({
        chainId,
        publicClient: publicClient as PublicClient
      });

      const { token } = await collectorClient.getToken({
        mintType: '1155',
        tokenContract: contract,
        tokenId
      });

      console.log('Token:', token);

      const secondaryInfo = await collectorClient.getSecondaryInfo({
        contract,
        tokenId: BigInt(tokenId ?? 0)
      });

      console.debug('Secondary info:', secondaryInfo);

      const identityResponse = await axios.get(`${API_URL}/api/user/identities/${token.creator}`);
      const owner =
        identityResponse.data !== ''
          ? identityResponse.data
          : ({ address: token.creator } as IdentityType);

      /*   const metadata = await fetchTokenMetadata(token.tokenURI);
      if (!metadata) {
        return;
      } */

      return {
        provider,
        chainId,
        contract,
        tokenId,
        referral,
        collectionName: `${token.contract.name} #${tokenId}`,
        metadata: {
          name: metadata.name,
          description: metadata.description ?? '',
          image: metadata.image.thumbnailUrl
        },
        owner,
        mintType: token.mintType,
        salesStatus: secondaryInfo?.saleEnd ? 'ended' : 'live'
      };
    }
    const mintType = provider === 'highlight.xyz' ? '721' : '1155';

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
      chainId,
      contract,
      tokenId,
      referral,
      collectionName: metadata.name + (tokenId ? ` #${tokenId}` : ''),
      metadata: {
        name: metadata.name,
        description: metadata.description ?? '',
        image:
          tokenId || metadata.image.contentType === 'image/gif'
            ? metadata.image.thumbnailUrl
            : metadata.image.cachedUrl
      },
      owner: identity,
      mintType
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

  console.log('Contract URI:', contractURI);

  const contractMetadataResponse = await axios.get(contractURI, { withCredentials: false });
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

    console.log('Resolved metadata URI:', resolvedMetadataUri);
    const metadataResponse = await axios.get(resolvedMetadataUri);

    const metadata = metadataResponse.data;
    const name = metadata.name;
    const description = metadata.description;
    const imageUri = metadata.image;
    const resolvedImageUri = `https://media.decentralized-content.com/-/rs:fit:64:64/${btoa(
      resolveIpfsUri(imageUri)
    )}`;

    console.debug('Metadata:', metadata);
    console.debug('Image URL:', resolvedImageUri);

    return { name, description, image: resolvedImageUri };
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

export const parseMintToken = (token: string) => {
  const [provider, contract, tokenId, referral, author] = token.split(':');

  return {
    provider,
    contract,
    tokenId: tokenId ? parseInt(tokenId) : undefined,
    referral: referral === '' ? undefined : referral,
    author: author === '' ? undefined : author
  } as ParsedMintData;
};

export function createShareFrameUrl({
  mint,
  profile
}: {
  mint: MintMetadata;
  profile: ProfileType;
}): string {
  const shareFrameUrl = new URL(`${DAPP_URL}/mint`);
  shareFrameUrl.searchParams.append('provider', mint.provider);
  shareFrameUrl.searchParams.append('chainId', mint.chainId.toString());
  shareFrameUrl.searchParams.append('contract', mint.contract);
  if (mint.tokenId) {
    shareFrameUrl.searchParams.append('tokenId', mint.tokenId.toString());
  }
  if (profile.identity) {
    shareFrameUrl.searchParams.append('referral', profile.identity);
  }
  return shareFrameUrl.toString();
}

const providerFarcasterChannelMap: { [key: string]: string } = {
  'zora.co': 'zora',
  'rodeo.club': 'rodeo-club',
  'highlight.xyz': 'highlight'
};

export function createShareUrls({
  mint,
  recipientSocial,
  profile,
  isGift,
  tokenAmount
}: {
  mint: MintMetadata;
  recipientSocial: SocialInfoType;
  profile: ProfileType;
  isGift: boolean;
  tokenAmount: number;
}): { shareFrameUrl: string; text: string; channelKey: string } {
  const shareFrameUrl = createShareFrameUrl({ mint, profile });

  let text = isGift ? `I just gifted ` : `I just minted `;

  if (tokenAmount > 1) {
    text += `${tokenAmount}x `;
  }

  const farcasterSocial = mint.owner?.meta?.socials.find((s) => s.dappName === FARCASTER_DAPP);
  if (farcasterSocial) {
    text += `@${farcasterSocial.profileName}'s `;
  }

  text += `${mint.metadata.name}: ${mint.collectionName} `;

  switch (mint.provider) {
    case 'zora.co':
      text += `on @zora `;
      break;
    case 'rodeo.club':
      text += `on @rodeodotclub `;
      break;
    case 'highlight.xyz':
      text += `on @highlight `;
      break;
    default:
      text += `on ${mint.provider} `;
  }

  if (isGift) {
    text += `to @${recipientSocial.profileName} `;
  }

  text += `\n\n@payflow lets you mint or gift collectibles with 30+ tokens cross-chain! cc: @sinaver.eth /payflow`;

  const channelKey = providerFarcasterChannelMap[mint.provider] || 'nft';

  return { shareFrameUrl, text, channelKey };
}
