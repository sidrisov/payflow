import { Web3AuthConnector } from '@web3auth/web3auth-wagmi-connector';
import { Web3Auth } from '@web3auth/modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { CHAIN_NAMESPACES } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { TorusWalletConnectorPlugin } from '@web3auth/torus-wallet-connector-plugin';

const CLIENT_ID = import.meta.env.VITE_WEB3AUTH_PNP_CLIENT_ID;
const API_KEY = import.meta.env.VITE_WEB3AUTH_TORUS_API_KEY;
const name = 'Social Login';
const iconUrl = 'https://images.web3auth.io/login-google-active.svg';

export const rainbowWeb3AuthConnector = ({ chains }: { chains: any[] }) => {
  const mainnet = chains[0]; //chains.find((c) => c.id === 1);
  // Create Web3Auth Instance
  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0x' + mainnet.id.toString(16),
    rpcTarget: mainnet.rpcUrls.default.http[0], // This is the public RPC we have added, please pass on your own endpoint while creating an app
    displayName: mainnet.name,
    tickerName: mainnet.nativeCurrency?.name,
    ticker: mainnet.nativeCurrency?.symbol,
    blockExplorer: mainnet.blockExplorers?.default.url[0]
  };
  const web3AuthInstance = new Web3Auth({
    clientId: CLIENT_ID,
    chainConfig,
    uiConfig: {
      loginMethodsOrder: ['google'],
      defaultLanguage: 'en',
      modalZIndex: '2147483647'
    },
    web3AuthNetwork: 'cyan',
    authMode: 'WALLET'
  });

  // Add openlogin adapter for customisations
  const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });
  const openloginAdapterInstance = new OpenloginAdapter({
    loginSettings: {
      mfaLevel: 'optional' // default, optional, mandatory, none
    },
    privateKeyProvider,
    adapterSettings: {
      network: 'cyan',
      uxMode: 'popup'
    }
  });
  web3AuthInstance.configureAdapter(openloginAdapterInstance);

  // Add Torus Wallet Plugin
  const torusPlugin = new TorusWalletConnectorPlugin({
    torusWalletOpts: {
      apiKey: API_KEY,
      buttonPosition: 'bottom-right',
      buttonSize: 48
    },
    walletInitOptions: {
      whiteLabel: {
        theme: { isDark: true, colors: { primary: '#00a8ff' } },
        logoDark: iconUrl,
        logoLight: iconUrl
      },
      useWalletConnect: false,
      enableLogging: false
    }
  });
  web3AuthInstance.addPlugin(torusPlugin);
  return {
    id: 'web3auth',
    name,
    iconUrl,
    iconBackground: '#fff',
    createConnector: () => {
      const connector = new Web3AuthConnector({
        chains: chains,
        options: {
          web3AuthInstance
        }
      });
      return {
        connector
      };
    }
  };
};
