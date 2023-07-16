import { utils, Wallet, Provider, EIP712Signer, types } from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import dotenv from 'dotenv';
import { PayFlow } from '../typechain-types';
dotenv.config();

// Get private key from the environment variable
const PRIVATE_KEY: string = process.env.ZKS_PRIVATE_KEY || '';
if (!PRIVATE_KEY) {
  throw new Error('Please set ZKS_PRIVATE_KEY in the environment variables.');
}

const PAY_FLOW_FACTORY_ADDRESS = process.env.PAY_FLOW_FACTORY_ADDRESS || '';
if (!PAY_FLOW_FACTORY_ADDRESS) {
  throw new Error('Please set PAY_FLOW_FACTORY_ADDRESS in the environment variables.');
}

// Put the address of your Wallet 1
const MULTISIG_OWNER_ADDRESS_1 = process.env.MULTISIG_OWNER_ADDRESS_1 || '';
if (!MULTISIG_OWNER_ADDRESS_1) {
  throw new Error('Please set MULTISIG_OWNER_ADDRESS_1 in the environment variables.');
}

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider('https://zksync2-testnet.zksync.dev');
  const wallet = new Wallet(PRIVATE_KEY).connect(provider);
  const factoryArtifact = await hre.artifacts.readArtifact('PayFlowFactory');
  const payFlowArtifact = await hre.artifacts.readArtifact('PayFlow');

  const factory = new ethers.Contract(PAY_FLOW_FACTORY_ADDRESS, factoryArtifact.abi, wallet);

  // For the simplicity of the tutorial, we will use zero hash as salt
  const salt = '0x0000000000000000000000000000000000000000000000000000000000000002';

  const tx = await factory.deployContract(salt, MULTISIG_OWNER_ADDRESS_1);
  await tx.wait();

  // Getting the address of the deployed contract
  const abiCoder = new ethers.utils.AbiCoder();
  const payFlowAddress = utils.create2Address(
    PAY_FLOW_FACTORY_ADDRESS,
    await factory.bytecodeHash(),
    salt,
    abiCoder.encode(['address'], [MULTISIG_OWNER_ADDRESS_1])
  );
  console.log(`PayFlow deployed on address ${payFlowAddress}`);

  await hre.run('verify:verify', {
    address: payFlowAddress,
    contract: 'contracts/PayFlow.sol:PayFlow',
    constructorArguments: [MULTISIG_OWNER_ADDRESS_1]
  });

  await (
    await wallet.sendTransaction({
      to: payFlowAddress,
      // You can increase the amount of ETH sent to the PayFlow
      value: ethers.utils.parseEther('0.008')
    })
  ).wait();

  const payFlow = new ethers.Contract(payFlowAddress, payFlowArtifact.abi, wallet) as PayFlow;

  console.log(
    `The payflow's balance before withdrawal ${await provider.getBalance(payFlowAddress)}`
  );

  await (await payFlow.withdraw(ethers.utils.parseEther('0.008'))).wait();

  console.log(
    `The payflow's balance after withdrawal ${await provider.getBalance(payFlowAddress)}`
  );
}
