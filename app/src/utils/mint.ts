import { readContract } from '@wagmi/core';
import axios from 'axios';
import { Abi, Address, ContractFunctionArgs, ContractFunctionName, PublicClient } from 'viem';
import { IdentityType } from '../types/ProfileType';
import { API_URL } from './urlConstants';
import { wagmiConfig } from './wagmiConfig';
import { zoraErc1155Abi } from './abi/zoraErc1155Abi';
import { useMemo, useState } from 'react';
import { createCollectorClient } from '@zoralabs/protocol-sdk';
import { getPublicClient } from 'wagmi/actions';

export interface MintMetadata {
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
}

export async function fetchMintData(
  provider: string,
  chainId: number,
  contract: Address,
  tokenId?: number,
  referral?: Address
): Promise<MintMetadata | undefined> {
  try {
    const collectionOwner = await fetchCollectionOwner(chainId, contract);
    const identityResponse = await axios.get(`${API_URL}/api/user/identities/${collectionOwner}`);
    const owner =
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
      chainId,
      contract,
      tokenId,
      referral,
      collectionName,
      metadata,
      owner
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

type PaymentTx = {
  chainId: number;
  address: Address;
  abi: Abi;
  functionName: ContractFunctionName;
  args?: ContractFunctionArgs;
  value?: bigint;
};

export const useMintPaymentTx = ({
  mint,
  minter,
  recipient,
  comment
}: {
  mint: MintMetadata;
  minter: Address;
  recipient: Address | undefined;
  comment?: string;
}) => {
  const [paymentTx, setPaymentTx] = useState<PaymentTx>();

  useMemo(async () => {
    if (!minter || !recipient) {
      return;
    }

    const publicClient = getPublicClient(wagmiConfig, { chainId: mint.chainId });
    const collectorClient = createCollectorClient({
      chainId: mint.chainId,
      publicClient: publicClient as PublicClient
    });

    const { parameters } = await collectorClient.mint({
      minterAccount: minter,
      mintType: '1155',
      quantityToMint: 1,
      tokenContract: mint.contract,
      tokenId: mint.tokenId,
      mintReferral: mint.referral,
      mintRecipient: recipient,
      mintComment: comment
    });

    setPaymentTx({ ...parameters, chainId: mint.chainId });
  }, [mint, minter, recipient, comment]);

  console.log('Mint tx: ', paymentTx);
  return { paymentTx };
};

type ParsedMintData = {
  provider: string;
  contract: Address;
  tokenId?: number;
  referral?: Address;
};

export const parseMintToken = (token: string) => {
  const [provider, contract, tokenId, referral] = token.split(':');

  return {
    provider,
    contract,
    tokenId: tokenId ? parseInt(tokenId) : undefined,
    referral
  } as ParsedMintData;
};
