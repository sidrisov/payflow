import { createCollectorClient } from '@zoralabs/protocol-sdk';
import { useState, useMemo } from 'react';
import {
  Address,
  Abi,
  ContractFunctionName,
  ContractFunctionArgs,
  PublicClient,
  zeroAddress,
  parseEther
} from 'viem';
import { getPublicClient, readContract } from 'wagmi/actions';
import { rodeoMintAbi } from '../abi/rodeoMintAbi';
import { RODEO_MINT_CONTRACT_ADDR } from '../contracts';
import { MintMetadata } from '../mint';
import { wagmiConfig } from '../wagmiConfig';

type PaymentTx = {
  chainId: number;
  address: Address;
  abi: Abi;
  functionName: ContractFunctionName;
  args?: ContractFunctionArgs;
  value?: bigint;
};

const RODEO_MINT_PRICE = parseEther('0.0001');

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

