import { readContract } from '@wagmi/core';
import axios from 'axios';
import {
  Abi,
  Address,
  ContractFunctionArgs,
  ContractFunctionName,
  parseEther,
  PublicClient,
  zeroAddress
} from 'viem';
import { IdentityType } from '../types/ProfileType';
import { API_URL } from './urlConstants';
import { wagmiConfig } from './wagmiConfig';
import { zoraErc1155Abi } from './abi/zoraErc1155Abi';
import { useMemo, useState } from 'react';
import {
  createCollectorClient} from '@zoralabs/protocol-sdk';
import { getPublicClient } from 'wagmi/actions';
import { rodeoMintAbi } from './abi/rodeoMintAbi';
import { RODEO_MINT_CONTRACT_ADDR } from './contracts';

const RODEO_MINT_PRICE = parseEther('0.0001');

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
  const [mintStatus, setMintStatus] = useState<'live' | 'ended' | 'error'>();

  useMemo(async () => {
    if (!minter || !recipient) {
      return;
    }

    try {
      if (mint.provider === 'zora.co') {
        const publicClient = getPublicClient(wagmiConfig, { chainId: mint.chainId });

        const collectorClient = createCollectorClient({
          chainId: mint.chainId,
          publicClient: publicClient as PublicClient
        });

        const { parameters } = await collectorClient.mint({
          minterAccount: minter,
          mintType: mint.mintType as any,
          quantityToMint: 1,
          tokenContract: mint.contract,
          tokenId: mint.tokenId,
          mintReferral: mint.referral,
          mintRecipient: recipient,
          mintComment: comment
        });

        setMintStatus('live');
        setPaymentTx({ ...parameters, chainId: mint.chainId });
      } else if (mint.provider === 'rodeo.club') {
        const saleTermsId = await readContract(wagmiConfig, {
          chainId: mint.chainId,
          address: RODEO_MINT_CONTRACT_ADDR,
          abi: rodeoMintAbi,
          functionName: 'getSaleTermsForToken',
          args: [mint.contract, mint.tokenId]
        });

        setMintStatus('live');
        setPaymentTx({
          chainId: mint.chainId,
          address: RODEO_MINT_CONTRACT_ADDR,
          abi: rodeoMintAbi as Abi,
          functionName: 'mintFromFixedPriceSale',
          args: [saleTermsId, 1n, recipient, mint.referral ?? zeroAddress],
          value: RODEO_MINT_PRICE
        });
      } else {
        setMintStatus('error');
      }
    } catch (error) {
      console.error('Error checking mint status or preparing mint transaction:', error);
      setMintStatus('error');
    }
  }, [mint, minter, recipient, comment]);

  console.log('Mint tx: ', paymentTx);
  return { paymentTx, mintStatus };
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
    referral: referral === '' ? undefined : referral
  } as ParsedMintData;
};
