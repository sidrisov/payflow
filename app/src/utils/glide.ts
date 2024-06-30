import { createGlideConfig } from '@paywithglide/glide-js';
import { base, optimism, degen, arbitrum, mode } from 'wagmi/chains';

export const glideConfig = createGlideConfig({
  projectId: import.meta.env.VITE_GLIDE_API_KEY,
  chains: [base, optimism, degen, arbitrum, mode]
});
