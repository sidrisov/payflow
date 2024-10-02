export const fanTokenUrl = (tokenName: string) => {
  return `https://airstack.xyz/${
    tokenName.startsWith('network:')
      ? 'network'
      : tokenName.startsWith('/')
      ? `channels/${tokenName.replace('/', '')}`
      : `users/fc_fname:${tokenName}`
  }`;
};
