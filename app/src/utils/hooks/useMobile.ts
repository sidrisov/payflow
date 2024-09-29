import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useState } from 'react';

const useInWebView = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const safari = /safari/.test(userAgent);
  const ios = /iphone|ipod|ipad/.test(userAgent);

  // Exclude Safari on iOS
  if (ios && safari) return false;

  // Exclude Chrome
  if (/chrome/.test(userAgent)) return false;

  // Exclude common crypto wallet browsers
  if (/trustwallet|metamask|coinbase|phantom|warpcast/i.test(userAgent)) return false;

  // Check for common WebView indicators
  return (
    (/android/.test(userAgent) && /wv/.test(userAgent)) || /crios|fxios|edgios/.test(userAgent)
  );
};

export const useMobile = () => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('sm'));
};

export const useMiniApp = () => {
  // Check if the app is loaded in an iframe
  const isInIframe = window !== window.parent || window.self !== window.top;

  return isInIframe || useInWebView();
};

export function usePwa() {
  const [isPwa, setPwa] = useState(false);

  useEffect(() => {
    const checkIfPwa = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      setPwa(isStandalone);
    };

    checkIfPwa();

    // Optionally, add a listener for changes in display mode
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkIfPwa);

    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkIfPwa);
    };
  }, []);

  return isPwa;
}
