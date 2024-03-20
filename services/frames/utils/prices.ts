import axios from 'axios';
import { DEGEN_TOKEN, ETH_TOKEN, TokenPrices, USDC_TOKEN } from './erc20contracts';

const PRICE_API = 'https://api.coingecko.com/api/v3/simple/price';
const tokens = ['ethereum', 'usd-coin', 'degen-base'];

export async function fetchTokenPrices() {
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
  return tokenPrices;
}
