import Safe, { EthSafeSignature } from '@safe-global/protocol-kit';
import { SafeSignature, SafeTransaction } from '@safe-global/safe-core-sdk-types';
import { Address, Hex, slice, trim } from 'viem';
import { getPublicClient } from 'wagmi/actions';

import { getFallbackHandlerDeployment } from '@safe-global/safe-deployments';
import { CUSTOM_CONTRACTS, CUSTOM_CONTRACTS_CHAINS } from './safeContracts';

export function generatePreValidatedSignature(ownerAddress: string): SafeSignature {
  const signature =
    '0x000000000000000000000000' +
    ownerAddress.slice(2) +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '01';

  return new EthSafeSignature(ownerAddress, signature);
}

export async function signTransactionBySafe(
  target: Safe,
  signer: Safe,
  transaction: SafeTransaction
): Promise<SafeSignature | undefined> {
  const chainId = Number(await signer.getChainId());
  const pubClient = getPublicClient({ chainId });

  const targetAddress = (await target.getAddress()) as Address;
  const signerAddress = (await signer.getAddress()) as Address;
  const safeVersion = await signer.getContractVersion();

  const safeContract = signer.getContractManager().safeContract;

  const fallbackHandlerContract = await signer
    .getEthAdapter()
    .getCompatibilityFallbackHandlerContract({
      safeVersion,
      singletonDeployment: getFallbackHandlerDeployment({
        network: chainId.toString(),
        version: safeVersion
      }),
      customContractAddress: CUSTOM_CONTRACTS_CHAINS.includes(chainId)
        ? CUSTOM_CONTRACTS[chainId].fallbackHandlerAddress
        : undefined
    });

  if (!safeContract || !fallbackHandlerContract) {
    console.error('Safe contract not found');
    return;
  }

  const encodedTransactionData = safeContract.encode('encodeTransactionData', [
    transaction.data.to,
    transaction.data.value,
    transaction.data.data,
    transaction.data.operation,
    transaction.data.safeTxGas,
    transaction.data.baseGas,
    transaction.data.gasPrice,
    transaction.data.gasToken,
    transaction.data.refundReceiver,
    transaction.data.nonce
  ]) as Hex;

  const txDataRaw = (
    await pubClient.call({
      data: encodedTransactionData,
      to: targetAddress
    })
  ).data;

  if (!txDataRaw) {
    console.error('Failed to encode tx!');
    return;
  }

  // eth_call returns raw data, remove redundant
  // {31 bytes + capacity size} {31 byte + data size} {data} {extra zero to fit 32 bytes}
  // slince 32, and remove zeros on the right, although better to slice based on data size
  const txData = trim(slice(txDataRaw, 32 + 32), { dir: 'right' });

  const encodedGetMessageHash = fallbackHandlerContract.encode('getMessageHash', [txData]);

  const safeMessageHash = (
    await pubClient.call({
      data: encodedGetMessageHash as Hex,
      to: signerAddress
    })
  ).data;

  if (!safeMessageHash) {
    return;
  }

  const signature = await signer.signTransactionHash(safeMessageHash);
  const safeContractSignature = buildContractSignature(signerAddress, signature.data);

  // small hack, concatanate signatures here, and pass as a single signature, safe sdk will just append
  const encodedSignature = buildSignatureBytes([safeContractSignature]);

  return new EthSafeSignature(signerAddress, encodedSignature);
}

export const buildContractSignature = (
  signerAddress: string,
  signature: string
): SafeSignatureDynamic => {
  return {
    signer: signerAddress,
    data: signature,
    dynamic: true
  };
};

export const buildSignatureBytes = (signatures: SafeSignatureDynamic[]): string => {
  const SIGNATURE_LENGTH_BYTES = 65;
  signatures.sort((left, right) =>
    left.signer.toLowerCase().localeCompare(right.signer.toLowerCase())
  );

  let signatureBytes = '0x';
  let dynamicBytes = '';
  for (const sig of signatures) {
    if (sig.dynamic) {
      /* 
                A contract signature has a static part of 65 bytes and the dynamic part that needs to be appended at the end of 
                end signature bytes.
                The signature format is
                Signature type == 0
                Constant part: 65 bytes
                {32-bytes signature verifier}{32-bytes dynamic data position}{1-byte signature type}
                Dynamic part (solidity bytes): 32 bytes + signature data length
                {32-bytes signature length}{bytes signature data}
            */
      const dynamicPartPosition = (
        signatures.length * SIGNATURE_LENGTH_BYTES +
        dynamicBytes.length / 2
      )
        .toString(16)
        .padStart(64, '0');

      const dynamicPartLength = (sig.data.slice(2).length / 2).toString(16).padStart(64, '0');
      const staticSignature = `${sig.signer.slice(2).padStart(64, '0')}${dynamicPartPosition}00`;
      const dynamicPartWithLength = `${dynamicPartLength}${sig.data.slice(2)}`;

      signatureBytes += staticSignature;
      dynamicBytes += dynamicPartWithLength;
    } else {
      signatureBytes += sig.data.slice(2);
    }
  }

  return signatureBytes + dynamicBytes;
};

export interface SafeSignatureDynamic {
  signer: string;
  data: string;
  // a flag to indicate if the signature is a contract signature and the data has to be appended to the dynamic part of signature bytes
  dynamic?: true;
}
