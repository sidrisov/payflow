import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { tokens as SUPPORTED_TOKENS, Token, TokenPrices } from '@payflow/common';
import { base, degen, zora } from 'viem/chains';
import { SUPPORTED_CHAINS } from '../networks';

const PRICE_API = 'https://api.coingecko.com/api/v3/simple/price';
const tokens = ['ethereum', 'degen-base'];

const TOKEN_PRICE_API = 'https://api.geckoterminal.com/api/v2/simple/networks';

const chainNameMap: { [key: number]: string } = {
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

      if (response.data.hasOwnProperty('ethereum')) {
        tokenPrices['eth'] = response.data.ethereum.usd;
      } else if (response.data.hasOwnProperty('degen-base')) {
        tokenPrices['degen'] = response.data['degen-base'].usd;
      }

      for (const chain of SUPPORTED_CHAINS) {
        const chainId = chain.id;

        // Filter tokens for the current chain
        const tokensForChain = SUPPORTED_TOKENS.filter(
          (token) => token.chainId === chainId && token.tokenAddress
        );

        // Filter tokens that are not already present in tokenPrices
        const tokensToFetch = tokensForChain.filter(
          (token) =>
            !tokenPrices.hasOwnProperty(token.id) &&
            (!token.underlyingToken || !tokenPrices.hasOwnProperty(token.underlyingToken?.id))
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

export const useTokenPrice = (token?: Token) => {
  return useQuery<number | null>({
    enabled: Boolean(token),
    queryKey: ['tokenPrice', token],
    staleTime: Infinity,
    refetchInterval: 120_000,
    queryFn: async () => {
      if (!token) return null;

      // Special handling for ETH
      if (token.id === 'eth' || token.underlyingToken?.id === 'eth') {
        const response = await axios.get(PRICE_API, {
          params: { ids: 'ethereum', vs_currencies: 'usd' }
        });
        return response.data.ethereum.usd;
      }

      // Special handling for DEGEN
      if (token.id === 'degen' || token.underlyingToken?.id === 'degen') {
        const response = await axios.get(PRICE_API, {
          params: { ids: 'degen-base', vs_currencies: 'usd' }
        });
        return response.data['degen-base'].usd;
      }

      if (!token.tokenAddress) return null;

      const chain = SUPPORTED_CHAINS.find((c) => c.id === token.chainId);
      if (!chain) return null;

      try {
        const chainName = getPriceChainName(token.chainId, token.chain);
        const response = await axios.get(
          `${TOKEN_PRICE_API}/${chainName}/token_price/${token.tokenAddress}`
        );

        const tokenPricesData = response.data.data.attributes.token_prices;
        return tokenPricesData[token.tokenAddress] || null;
      } catch (error) {
        console.error('Error fetching token price:', error);
        return null;
      }
    }
  });
};
