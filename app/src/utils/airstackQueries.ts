export const QUERY_FARCASTER_CHANNELS_FOR_USER = /* GraphQL */ `
  query GetFarcasterChannelsForUser($identity: Identity!) {
    FarcasterChannels(
      input: { blockchain: ALL, filter: { moderatorIdentity: { _eq: $identity } }, limit: 10 }
    ) {
      FarcasterChannel {
        channelId
        name
        description
        imageUrl
      }
    }
  }
`;

export const QUERY_FARCASTER_CHANNELS_FOR_CHANNEL_ID = /* GraphQL */ `
  query GetFarcasterChannelsForChannelId($channelId: String!) {
    FarcasterChannels(
      input: {
        blockchain: ALL
        filter: { channelId: { _regex: $channelId } }
        order: { followerCount: DESC }
        limit: 10
      }
    ) {
      FarcasterChannel {
        channelId
        name
        description
        imageUrl
      }
    }
  }
`;
