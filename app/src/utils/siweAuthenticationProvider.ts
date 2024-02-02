import { createAuthenticationAdapter } from '@rainbow-me/rainbowkit';
import { SiweMessage } from 'siwe';
import { API_URL } from './urlConstants';

const authenticationAdapter = createAuthenticationAdapter({
  getNonce: async () => {
    const response = await fetch(`${API_URL}/api/auth/nonce`);
    return await response.text();
  },
  createMessage: ({ nonce, address, chainId }) => {
    return new SiweMessage({
      domain: window.location.host,
      address,
      statement: 'Sign in with Ethereum to the app.',
      uri: window.location.origin,
      version: '1',
      chainId,
      nonce
    });
  },
  getMessageBody: ({ message }) => {
    return message.prepareMessage();
  },
  verify: async ({ message, signature }) => {
    console.debug(message, signature);
    const verifyRes = await fetch(`${API_URL}/api/auth/verify/${message.address}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature })
    });

    return Boolean(verifyRes.ok);
  },
  signOut: async () => {
    await fetch(`${API_URL}/api/auth/logout`);
  }
});

export default authenticationAdapter;
