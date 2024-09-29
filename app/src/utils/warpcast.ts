export function createComposeCastUrl(text: string, frameEmbed: string, channelKey: string): string {
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(
    text
  )}&embeds[]=${encodeURIComponent(frameEmbed)}&channelKey=${channelKey}`;
}

export function createCastPostMessage(text: string, frameEmbed: string, channelKey?: string) {
  return {
    type: 'createCast',
    data: {
      cast: {
        text: encodeURIComponent(text),
        embeds: [encodeURI(frameEmbed)],
        channelKey
      }
    }
  };
}
