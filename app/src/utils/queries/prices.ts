import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { SUPPORTED_TOKENS, TokenPrices } from '../erc20contracts';
import { degen, zora } from 'viem/chains';
import { SUPPORTED_CHAINS } from '../networks';

const PRICE_API = 'https://api.coingecko.com/api/v3/simple/price';
const tokens = ['ethereum'];

const TOKEN_PRICE_API = 'https://api.geckoterminal.com/api/v2/simple/networks';

const chainNameMap: { [key: number]: string } = {
  [degen.id]: 'degenchain',
  [zora.id]: 'zora-network'
};

function getPriceChainName(chainId: number, chainName: string): string {
  return chainNameMap[chainId] || chainName;
}

export const useTokenPrices = () => {
  return useQuery<TokenPrices>({
    queryKey: ['prices', { tokens }],
    staleTime: Infinity,
    refetchInterval: 120_000,
    queryFn: async () => {
      const response = await axios.get(PRICE_API, {
        params: { ids: tokens.join(','), vs_currencies: 'usd' }
      });

      // TODO: some hardcoding, fetch separately
      const tokenPrices: TokenPrices = {};
      for (const [_, value] of Object.entries(response.data)) {
        tokenPrices['eth'] = (value as any).usd;
      }

      for (const chain of SUPPORTED_CHAINS) {
        const chainId = chain.id;

        // Filter tokens for the current chain
        const tokensForChain = SUPPORTED_TOKENS.filter(
          (token) => token.chainId === chainId && token.tokenAddress
        );

        // Filter tokens that are not already present in tokenPrices
        const tokensToFetch = tokensForChain.filter(
          (token) => !tokenPrices.hasOwnProperty(token.id)
        );

        if (tokensToFetch.length === 0) {
          // All tokens for this chain are already fetched, no need to make API call
          continue;
        }

        const chainName = getPriceChainName(chainId, tokensToFetch[0].chain);

        // Fetch token prices for the tokens to fetch
        const response = await axios.get(
          `${TOKEN_PRICE_API}/${chainName}/token_price/${tokensToFetch
            .map((token) => token.underlyingToken?.tokenAddress ?? token.tokenAddress)
            .join(',')}`
        );

        const tokenPricesData = response.data.data.attributes.token_prices;

        // Update tokenPrices object with token prices for the current chain
        tokensToFetch.forEach((token) => {
          const tokenAddress = token.underlyingToken?.tokenAddress ?? token.tokenAddress;
          if (tokenAddress && tokenPricesData.hasOwnProperty(tokenAddress)) {
            tokenPrices[token.id] = tokenPricesData[tokenAddress];
          }
        });
      }

      return tokenPrices;
    }
  });
};
