import { readContract } from '@wagmi/core';
import axios from 'axios';
import { Address, PublicClient } from 'viem';
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
  provider: string;
  contract: Address;
  tokenId?: number;
  referral?: Address;
  author?: Address;
};

export type MintMetadata = {
  provider: string;
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
  provider: string,
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

      token.mintType;

      //const salesConfig = (token as Partial<{ salesConfig: SalesConfigParamsType }>).salesConfig!;

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
        mintType: token.mintType
      };
    }

    const collectionOwner = await fetchCollectionOwner(chainId, contract);
    const identityResponse = await axios.get(`${API_URL}/api/user/identities/${collectionOwner}`);
    const owner =
      identityResponse.data !== ''
        ? identityResponse.data
        : ({ address: collectionOwner } as IdentityType);

    const collectionName = tokenId
      ? (await fetchCollectionName(chainId, contract)).concat(` #${tokenId}`)
      : await fetchCollectionName(chainId, contract);

    console.log('Collection name:', collectionName);

    const tokenMetadataUri = tokenId
      ? await fetchCollectionTokenMetadataURI(chainId, contract, tokenId)
      : null;

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
      owner,
      mintType: '1155'
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

export function createShareUrls({
  mint,
  recipientSocial,
  profile,
  isGift
}: {
  mint: MintMetadata;
  recipientSocial: Social;
  profile: ProfileType;
  isGift: boolean;
}): { shareFrameUrl: string; composeCastUrl: string } {
  const shareFrameUrl = createShareFrameUrl({ mint, profile });

  let text = isGift ? `I just gifted ` : `I just minted `;

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
    default:
      text += `on ${mint.provider} `;
  }

  if (isGift) {
    text += `to @${recipientSocial.profileName} `;
  }

  text += `using @payflow mint action`;

  text += `\n\n@payflow lets you mint collectibles with 20+ tokens across multiple chains!\ncc: @sinaver.eth /payflow`;

  const composeCastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
    text
  )}&embeds[]=${encodeURIComponent(shareFrameUrl)}`;

  return { shareFrameUrl, composeCastUrl };
}
