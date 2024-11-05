import { v4 as uuidv4 } from 'uuid';

export function createComposeCastUrl(text: string, frameEmbed: string, channelKey: string): string {
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(
    text
  )}&embeds[]=${encodeURIComponent(frameEmbed)}&channelKey=${channelKey}`;
}

export function createCastPostMessage(text: string, frameEmbed: string, channelKey?: string) {
  return {
    jsonrpc: '2.0',
    id: uuidv4(),
    method: 'fc_createCast',
    params: {
      text,
      embeds: [frameEmbed],
      channelKey
    }
  } as CreateCastMessage;
}

export type CreateCastMessage = {
  jsonrpc: '2.0';
  id: string | number | null;
  method: 'fc_createCast';
  params: {
    text: string;
    embeds: string[];
    channelKey?: string;
  };
};
