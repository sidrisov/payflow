import { useEffect } from 'react';
import { initialize as initializePimlico } from '@payflow/common';

export const usePimlicoInit = () => {
  useEffect(() => {
    initializePimlico({
      apiKey: import.meta.env.VITE_PIMLICO_API_KEY!,
      sponsoredEnabled: import.meta.env.VITE_PIMLICO_SPONSORED_ENABLED === 'true',
      mainnetPolicies: JSON.parse(import.meta.env.VITE_PIMLICO_SPONSORED_POLICY_MAINNET || '[]'),
      testnetPolicies: JSON.parse(import.meta.env.VITE_PIMLICO_SPONSORED_POLICY_SEPOLIA || '[]')
    });
  }, []);
};
