import { Social } from '../generated/graphql/types';
import { FRAMES_URL } from './urlConstants';

export const fanTokenUrl = (tokenName: string) => {
  return `https://airstack.xyz/${
    tokenName.startsWith('network:')
      ? 'network'
      : tokenName.startsWith('/')
      ? `channels/${tokenName.replace('/', '')}`
      : `users/fc_fname:${tokenName}`
  }`;
};

export function createShareFrameUrl({ tokenName }: { tokenName: string }): string {
  const shareFrameUrl = new URL(`${FRAMES_URL}/fan`);
  shareFrameUrl.searchParams.append('names', tokenName);
  return shareFrameUrl.toString();
}

export function createShareUrls({
  tokenName,
  recipientSocial,
  isGift,
  tokenAmount
}: {
  tokenName: string;
  recipientSocial: Social;
  isGift: boolean;
  tokenAmount: number;
}): { shareFrameUrl: string; text: string; channelKey: string } {
  const shareFrameUrl = createShareFrameUrl({ tokenName });

  let text = isGift ? `I just gifted ` : `I just bought `;

  text += `${tokenAmount} ${!tokenName.startsWith('/') && !tokenName.startsWith('network:') ? '@' : ''}${tokenName} fan token(s)`;

  if (isGift) {
    text += `to @${recipientSocial.profileName} `;
  }

  text += `\n\n@payflow cast action lets you buy or gift @moxie.eth fan tokens with 30+ tokens cross-chain! cc: @sinaver.eth /payflow`;

  const channelKey = tokenName.startsWith('/') ? tokenName.replace('/', '') : 'airstack';

  return { shareFrameUrl, text, channelKey };
}
