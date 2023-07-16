import { utils, Wallet, Provider, EIP712Signer, types } from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import dotenv from 'dotenv';
dotenv.config();

// Get private key from the environment variable
const PRIVATE_KEY: string = process.env.ZKS_PRIVATE_KEY || '';
if (!PRIVATE_KEY) {
  throw new Error('Please set ZKS_PRIVATE_KEY in the environment variables.');
}

// Put the address of your AA factory
const PAY_FLOW_MASTER_FACTORY_ADDRESS = process.env.PAY_FLOW_MASTER_FACTORY_ADDRESS || '';
if (!PAY_FLOW_MASTER_FACTORY_ADDRESS) {
  throw new Error('Please set PAY_FLOW_MASTER_FACTORY_ADDRESS in the environment variables.');
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
  const provider = new Provider('https://zksync2-testnet.zksync.dev');
  const wallet = new Wallet(PRIVATE_KEY).connect(provider);
  const factoryArtifact = await hre.artifacts.readArtifact('PayFlowMasterFactory');

  const aaFactory = new ethers.Contract(
    PAY_FLOW_MASTER_FACTORY_ADDRESS,
    factoryArtifact.abi,
    wallet
  );

  // For the simplicity of the tutorial, we will use zero hash as salt
  const salt = '0x0000000000000000000000000000000000000000000000000000000000000000';

  const tx = await aaFactory.deployAccount(
    salt,
    MULTISIG_OWNER_ADDRESS_1,
    MULTISIG_OWNER_ADDRESS_2,
    { gasPrice: 200000000 }
  );
  await tx.wait();

  // Getting the address of the deployed contract
  const abiCoder = new ethers.utils.AbiCoder();
  const multisigAddress = utils.create2Address(
    PAY_FLOW_MASTER_FACTORY_ADDRESS,
    await aaFactory.aaBytecodeHash(),
    salt,
    abiCoder.encode(['address', 'address'], [MULTISIG_OWNER_ADDRESS_1, MULTISIG_OWNER_ADDRESS_2])
  );
  console.log(`Multisig deployed on address ${multisigAddress}`);

  await hre.run('verify:verify', {
    address: multisigAddress,
    contract: 'contracts/PayFlowMaster.sol:PayFlowMaster',
    constructorArguments: [MULTISIG_OWNER_ADDRESS_1, MULTISIG_OWNER_ADDRESS_2]
  });

  await (
    await wallet.sendTransaction({
      to: multisigAddress,
      // You can increase the amount of ETH sent to the multisig
      value: ethers.utils.parseEther('0.008')
    })
  ).wait();

  let aaTx = await aaFactory.populateTransaction.deployAccount(
    '0x0000000000000000000000000000000000000000000000000000000000000001',
    Wallet.createRandom().address,
    Wallet.createRandom().address
  );

  const gasLimit = await provider.estimateGas(aaTx);
  const gasPrice = await provider.getGasPrice();

  aaTx = {
    ...aaTx,
    from: multisigAddress,
    gasLimit: gasLimit,
    gasPrice: gasPrice,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(multisigAddress),
    type: 113,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT
    } as types.Eip712Meta,
    value: ethers.BigNumber.from(0)
  };
  const signedTxHash = EIP712Signer.getSignedDigest(aaTx);

  const signature = ethers.utils.concat([
    // Note, that `signMessage` wouldn't work here, since we don't want
    // the signed hash to be prefixed with `\x19Ethereum Signed Message:\n`
    ethers.utils.joinSignature(wallet._signingKey().signDigest(signedTxHash)),
    ethers.utils.joinSignature(wallet._signingKey().signDigest(signedTxHash))
  ]);

  aaTx.customData = {
    ...aaTx.customData,
    customSignature: signature
  };

  console.log(
    `The multisig's nonce before the first tx is ${await provider.getTransactionCount(
      multisigAddress
    )}`
  );
  const sentTx = await provider.sendTransaction(utils.serialize(aaTx));
  await sentTx.wait();

  // Checking that the nonce for the account has increased
  console.log(
    `The multisig's nonce after the first tx is ${await provider.getTransactionCount(
      multisigAddress
    )}`
  );
}
