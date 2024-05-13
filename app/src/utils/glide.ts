import { createGlideClient } from '@paywithglide/glide-js';
import { base, optimism, degen } from 'wagmi/chains';

export const glideClient = createGlideClient({
  projectId: import.meta.env.VITE_GLIDE_API_KEY,
  chains: [base, optimism, degen]
});
