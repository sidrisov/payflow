import { readContract } from '@wagmi/core';
import axios from 'axios';
import { Address, erc721Abi, PublicClient } from 'viem';
import { IdentityType } from '../types/ProfileType';
import { API_URL, FRAMES_URL } from './urlConstants';
import { wagmiConfig } from './wagmiConfig';
import { zoraErc1155Abi } from './abi/zoraErc1155Abi';
import { createCollectorClient } from '@zoralabs/protocol-sdk';
import { getPublicClient } from 'wagmi/actions';
import { ProfileType } from '../types/ProfileType';
import { FARCASTER_DAPP } from './dapps';
import { Social } from '../generated/graphql/types';

type ParsedMintData = {
  provider: MintProvider;
  contract: Address;
  tokenId?: number;
  referral?: Address;
  author?: Address;
};
export type MintProvider = 'zora.co' | 'rodeo.club' | 'highlight.xyz';

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

      const metadata = await fetchTokenMetadata(token.tokenURI);
      if (!metadata) {
        return;
      }

      return {
        provider,
        chainId,
        contract,
        tokenId,
        referral,
        collectionName: `${token.contract.name} #${tokenId}`,
        metadata,
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

    console.log(`Fetching collection name for contract: ${contract}`);
    const collectionName = tokenId
      ? (await fetchCollectionName(chainId, contract)).concat(` #${tokenId}`)
      : await fetchCollectionName(chainId, contract);
    console.log(`Collection name: ${collectionName}`);

    console.log(`Fetching token metadata URI for tokenId: ${tokenId}`);
    const tokenMetadataUri = await fetchCollectionTokenMetadataURI(
      mintType,
      chainId,
      contract,
      tokenId ?? 1
    );
    console.log(`Token metadata URI: ${tokenMetadataUri}`);

    console.log(`Fetching token metadata from URI: ${tokenMetadataUri}`);
    const metadata = tokenMetadataUri ? await fetchTokenMetadata(tokenMetadataUri) : null;

    if (!metadata) {
      return;
    }

    return {
      provider,
      chainId,
      contract,
      tokenId,
      referral,
      collectionName,
      metadata,
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
  tokenId: number
): Promise<string> {
  // TODO: instead pre-fetch tokenId the one to mint
  const functionName = mintType === '721' ? (tokenId ? 'tokenURI' : 'contractURI') : 'uri';
  const abi = mintType === '721' ? erc721Abi : zoraErc1155Abi;
  return (await readContract(wagmiConfig, {
    chainId: chainId as any,
    address: contract,
    abi,
    functionName: functionName as any,
    args: tokenId ? [BigInt(tokenId)] : undefined
  })) as string;
}

export async function fetchTokenMetadata(metadataUri: string) {
  try {
    const resolvedMetadataUri = resolveIpfsUri(metadataUri);

    console.log('Resolved metadata URI:', resolvedMetadataUri);
    // add proxy
    /* const metadataResponse = await axios.get(
      `https://corsproxy.io/?${encodeURIComponent(resolvedMetadataUri)}`
    ); */
    const metadataResponse = await axios.get(resolvedMetadataUri);

    const metadata = metadataResponse.data;
    const name = metadata.name;
    const description = metadata.description;
    const imageUri = metadata.image;
    const resolvedImageUri = `https://media.decentralized-content.com/-/rs:fit:128:128/${btoa(
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
  const shareFrameUrl = new URL(`${FRAMES_URL}/mint`);
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
  recipientSocial: Social;
  profile: ProfileType;
  isGift: boolean;
  tokenAmount: number;
}): { shareFrameUrl: string; composeCastUrl: string } {
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

  text += `\n\n@payflow cast action lets you mint or gift collectibles with 25+ tokens cross-chain! cc: @sinaver.eth /payflow`;

  const channelKey = providerFarcasterChannelMap[mint.provider] || 'nft';

  const composeCastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
    text
  )}&embeds[]=${encodeURIComponent(shareFrameUrl)}&channelKey=${channelKey}`;

  return { shareFrameUrl, composeCastUrl };
}
