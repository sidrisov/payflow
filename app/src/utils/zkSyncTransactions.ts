import { WalletClient } from 'wagmi';
import { Address, Hash, concat, encodeFunctionData, publicActions } from 'viem';
import { utils, EIP712Signer, types } from 'zksync-web3';
import { eip712Types } from 'zksync-web3/build/src/signer';
import PayFlowArtifact from '../../../smart-accounts/zksync-aa/artifacts-zk/contracts/PayFlow.sol/PayFlow.json';

export async function transferEth(
  walletClient: WalletClient,
  tx: { from: Address; to: Address; amount: bigint }
): Promise<Hash> {
  const client = walletClient.extend(publicActions);

  let ethTransferTx = {
    from: tx.from,
    to: tx.to,
    chainId: walletClient.chain.id,
    nonce: await client.getTransactionCount({
      address: tx.from
    }),
    type: 113,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT
    } as types.Eip712Meta,
    value: tx.amount,
    gasPrice: await client.getGasPrice(),
    gasLimit: 2000000, // constant 20M since estimateGas() causes an error and this tx consumes more than 15M at most
    data: '0x'
  };

  //console.log('Transaction (no signature): ', ethTransferTx);

  const eip712Domain = {
    name: 'zkSync',
    version: '2',
    chainId: ethTransferTx.chainId
  };

  const message = EIP712Signer.getSignInput(ethTransferTx);

  const signature_typed = await client.signTypedData({
    domain: eip712Domain,
    types: eip712Types,
    primaryType: 'Transaction',
    message
  });

  const signature = concat([
    // Note, that `signMessage` wouldn't work here, since we don't want
    // the signed hash to be prefixed with `\x19Ethereum Signed Message:\n`
    signature_typed,
    signature_typed
  ]);

  ethTransferTx.customData = {
    ...ethTransferTx.customData,
    customSignature: signature
  };

  //console.log('Transaction (with signature): ', ethTransferTx);

  const rawTransaction = utils.serialize(ethTransferTx);

  return client.request({
    method: 'eth_sendRawTransaction',
    params: [rawTransaction as `0x${string}`]
  });
}

export async function withdrawEth(
  walletClient: WalletClient,
  tx: { contract: Address; from: Address; amount: bigint }
): Promise<Hash> {
  const client = walletClient.extend(publicActions);

  const data = encodeFunctionData({
    abi: PayFlowArtifact.abi,
    functionName: 'withdraw',
    args: [tx.amount]
  });

  let ethTransferTx = {
    from: tx.from,
    to: tx.contract,
    chainId: walletClient.chain.id,
    nonce: await client.getTransactionCount({
      address: tx.from
    }),
    type: 113,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT
    } as types.Eip712Meta,
    value: BigInt(0),
    gasPrice: await client.getGasPrice(),
    gasLimit: 2000000, // constant 20M since estimateGas() causes an error and this tx consumes more than 15M at most
    data
  };

  //console.log('Transaction (no signature): ', ethTransferTx);

  const eip712Domain = {
    name: 'zkSync',
    version: '2',
    chainId: ethTransferTx.chainId
  };

  const message = EIP712Signer.getSignInput(ethTransferTx);

  const signature_typed = await client.signTypedData({
    domain: eip712Domain,
    types: eip712Types,
    primaryType: 'Transaction',
    message
  });

  const signature = concat([
    // Note, that `signMessage` wouldn't work here, since we don't want
    // the signed hash to be prefixed with `\x19Ethereum Signed Message:\n`
    signature_typed,
    signature_typed
  ]);

  ethTransferTx.customData = {
    ...ethTransferTx.customData,
    customSignature: signature
  };

  //console.log('Transaction (with signature): ', ethTransferTx);

  const rawTransaction = utils.serialize(ethTransferTx);

  return client.request({
    method: 'eth_sendRawTransaction',
    params: [rawTransaction as `0x${string}`]
  });
}
