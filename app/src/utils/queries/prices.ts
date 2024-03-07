import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { DEGEN_TOKEN, ETH_TOKEN, TokenPrices, USDC_TOKEN } from '../erc20contracts';

const PRICE_API = 'https://api.coingecko.com/api/v3/simple/price';
const tokens = ['ethereum', 'usd-coin', 'degen-base'];

export const useTokenPrices = () => {
  return useQuery<TokenPrices>({
    queryKey: ['prices', { tokens }],
    staleTime: Infinity,
    refetchInterval: 60_000,
    queryFn: () =>
      axios
        .get(PRICE_API, {
          params: { ids: tokens.join(','), vs_currencies: 'usd' }
        })
        .then((res) => {
          const tokenPrices: TokenPrices = {};
          for (const [key, value] of Object.entries(res.data)) {
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
          return tokenPrices;
        })
  });
};

/*
const tokenPrices = {
        [ETH_TOKEN]: ethUsdPrice,
        [USDC_TOKEN]: 1,
        [DEGEN_TOKEN]: response.data.pair.priceUsd
      } as TokenPrices;*/
