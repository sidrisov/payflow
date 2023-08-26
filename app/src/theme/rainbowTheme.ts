import { Theme, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import merge from 'lodash.merge';

export const customLightTheme = lightTheme({ overlayBlur: 'small' });
export const customDarkTheme = merge(darkTheme({ overlayBlur: 'small' }), {
  colors: {
    modalBackground: '#242424',
    connectButtonBackground: '#1e1e1e'
  }
} as Theme);
