import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  DEGEN_TOKEN,
  ERC20_CONTRACTS,
  ETH_TOKEN,
  TokenPrices,
  USDC_TOKEN
} from '../erc20contracts';
import { degen } from 'viem/chains';

const PRICE_API = 'https://api.coingecko.com/api/v3/simple/price';
const tokens = ['ethereum', 'usd-coin', 'degen-base'];

const DEGEN_PRICE_API =
  'https://api.geckoterminal.com/api/v2/simple/networks/degenchain/token_price';

export const useTokenPrices = () => {
  return useQuery<TokenPrices>({
    queryKey: ['prices', { tokens }],
    staleTime: Infinity,
    refetchInterval: 60_000,
    queryFn: async () => {
      const response = await axios.get(PRICE_API, {
        params: { ids: tokens.join(','), vs_currencies: 'usd' }
      });

      const tokenPrices: TokenPrices = {};
      for (const [key, value] of Object.entries(response.data)) {
        let token;
        switch (key) {
          case 'ethereum':
            token = ETH_TOKEN;
            break;
          case 'usd-coin':
            token = USDC_TOKEN;
            break;
          case 'degen-base':
            token = DEGEN_TOKEN;
            break;
        }

        if (token) {
          tokenPrices[token] = (value as any).usd;
        }
      }

      const degenResponse = await axios.get(
        DEGEN_PRICE_API.concat(
          '/' +
            ERC20_CONTRACTS[degen.id]
              .filter((t) => t.address)
              .map((t) => t.address)
              .join(',')
        )
      );

      const degenTokenPrices = degenResponse.data.data.attributes.token_prices;
      ERC20_CONTRACTS[degen.id].forEach((token) => {
        if (token.address && degenTokenPrices.hasOwnProperty(token.address)) {
          tokenPrices[token.name] = degenTokenPrices[token.address];
        }
      });

      return tokenPrices;
    }
  });
};
