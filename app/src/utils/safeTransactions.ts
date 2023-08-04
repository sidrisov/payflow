import { ethers, providers } from 'ethers';
import Safe, { EthersAdapter } from '@safe-global/protocol-kit';
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types';
import { Hash, Address } from 'viem';

export async function safeTransferEth(
  ethersSigner: providers.JsonRpcSigner,
  tx: { from: Address; to: Address; amount: bigint }
): Promise<Hash> {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: ethersSigner
  });

  const safeSdk = await Safe.create({ ethAdapter, safeAddress: tx.from as string });

  const safeTransactionData: SafeTransactionDataPartial = {
    to: tx.to,
    value: tx.amount.toString(),
    data: '0x'
  };
  const safeTransaction = await safeSdk.createTransaction({ safeTransactionData });

  const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);

  // TODO: not all testnets have transaction services, for now rely on onchain signatures
  //const senderSignature = await safeSdk.signTransactionHash(safeTxHash);

  //const txServiceUrl = 'https://safe-transaction-base-testnet.safe.global';
  //const safeService = new SafeApiKit({ txServiceUrl, ethAdapter });

  /*   await safeService.proposeTransaction({
    safeAddress: tx.from as string,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: await ethersSigner.getAddress(),
    senderSignature: senderSignature.data
  }); */

  await safeSdk.approveTransactionHash(safeTxHash);
  return (await safeSdk.executeTransaction(safeTransaction)).hash as Hash;
}
