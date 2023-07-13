import { utils, EIP712Signer, types } from 'zksync-web3';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { concat, createWalletClient, http, publicActions } from 'viem';
import { zkSyncTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

import dotenv from 'dotenv';
import { eip712Types } from 'zksync-web3/build/src/signer';
import { ethers } from 'ethers';
dotenv.config();

// Get private key from the environment variable
const PRIVATE_KEY: string = process.env.ZKS_PRIVATE_KEY || '';
if (!PRIVATE_KEY) {
  throw new Error('Please set ZKS_PRIVATE_KEY in the environment variables.');
}

// Put the address of your Wallet 2
const MULTISIG_ADDRESS = process.env.MULTISIG_ADDRESS || '';
if (!MULTISIG_ADDRESS) {
  throw new Error('Please set MULTISIG_ADDRESS in the environment variables.');
}

// Put the address of your Wallet 1
const MULTISIG_OWNER_ADDRESS_1 = process.env.MULTISIG_OWNER_ADDRESS_1 || '';
if (!MULTISIG_OWNER_ADDRESS_1) {
  throw new Error('Please set MULTISIG_OWNER_ADDRESS_1 in the environment variables.');
}

// Put the address of your Wallet 2
const MULTISIG_OWNER_ADDRESS_2 = process.env.MULTISIG_OWNER_ADDRESS_2 || '';
if (!MULTISIG_OWNER_ADDRESS_2) {
  throw new Error('Please set MULTISIG_OWNER_ADDRESS_2 in the environment variables.');
}

export default async function (hre: HardhatRuntimeEnvironment) {
  const walletClient = createWalletClient({
    account: privateKeyToAccount(`0x${PRIVATE_KEY}` as `0x${string}`),
    transport: http('https://zksync2-testnet.zksync.dev'),
    chain: zkSyncTestnet
  }).extend(publicActions);

  const multisigAddress = '0xA1B31C32B507206b1905E733F1a30C48D679b993';
  const transferAmount = '0.0001';

  let ethTransferTx = {
    from: multisigAddress,
    to: multisigAddress,
    chainId: walletClient.chain.id,
    nonce: await walletClient.getTransactionCount({
      address: multisigAddress
    }),
    type: 113,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT
    } as types.Eip712Meta,

    value: ethers.utils.parseEther(transferAmount),
    gasPrice: await walletClient.getGasPrice(),
    gasLimit: ethers.BigNumber.from(20000000), // constant 20M since estimateGas() causes an error and this tx consumes more than 15M at most
    data: '0x'
  };

  console.log('Transaction (no signature): ', ethTransferTx);

  const eip712Domain = {
    name: 'zkSync',
    version: '2',
    chainId: ethTransferTx.chainId
  };

  const signature_typed = await walletClient.signTypedData({
    domain: eip712Domain,
    types: eip712Types,
    primaryType: 'Transaction',
    message: EIP712Signer.getSignInput(ethTransferTx)
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

  console.log('Transaction (with signature): ', ethTransferTx);

  console.log(
    `The multisig's nonce before the first tx is ${await walletClient.getTransactionCount({
      address: multisigAddress
    })}`
  );

  const rawTransaction = utils.serialize(ethTransferTx);

  console.log(`Raw transaction: ${rawTransaction}`);

  const sentTx = await walletClient.request({
    method: 'eth_sendRawTransaction',
    params: [rawTransaction as `0x${string}`]
  });

  console.log(
    'Receipt:',
    await walletClient.waitForTransactionReceipt({
      hash: sentTx
    })
  );

  // Checking that the nonce for the account has increased
  console.log(
    `The multisig's nonce after the first tx is ${await walletClient.getTransactionCount({
      address: multisigAddress
    })}`
  );
}
