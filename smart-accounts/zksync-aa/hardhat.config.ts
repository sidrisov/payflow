import { HardhatUserConfig } from 'hardhat/config';

import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-verify';

import '@typechain/hardhat';

import dotenv from 'dotenv';
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.17'
  },
  zksolc: {
    version: 'latest',
    settings: {
      isSystem: true
    }
  },
  defaultNetwork: 'zkSyncTestnet',

  networks: {
    zkSyncTestnet: {
      url: 'https://zksync2-testnet.zksync.dev',
      ethNetwork: 'goerli', // Can also be the RPC URL of the network (e.g. `https://goerli.infura.io/v3/<API_KEY>`)
      zksync: true,
      verifyURL: 'https://zksync2-testnet-explorer.zksync.dev/contract_verification',
      accounts: [process.env.ZKS_PRIVATE_KEY],
      gas: 2100000
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      gas: 2100000,
      accounts: [process.env.ZKS_PRIVATE_KEY],
      zksync: false
    }
  },
  etherscan: {
    apiKey: process.env.GOERLI_ETHERSCAN_API_KEY
  }
};

export default config;
