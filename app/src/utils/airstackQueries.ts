export const QUERY_SOCIALS = /* GraphQL */ `
  query GetSocials($identity: Identity!) {
    Wallet(input: { identity: $identity }) {
      addresses
      primaryDomain {
        name
      }
      domains(input: { limit: 1 }) {
        name
      }
      socials(input: { limit: 5, filter: { followerCount: { _gt: 0 } } }) {
        dappName
        profileName
        profileDisplayName
        profileImage
        profileImageContentValue {
          image {
            extraSmall
          }
        }
        followerCount
      }
    }
  }
`;

export const QUERY_FARCASTER_PROFILE = /* GraphQL */ `
  query GetFarcasterProfile($fid: String) {
    Socials(
      input: {
        filter: { dappName: { _eq: farcaster }, userId: { _eq: $fid } }
        blockchain: ethereum
      }
    ) {
      Social {
        profileName
        profileDisplayName
        profileImageContentValue {
          image {
            extraSmall
          }
        }
        userId
      }
    }
  }
`;

export const QUERY_FARCASTER_PROFILE_BY_IDENTITY = /* GraphQL */ `
  query GetFarcasterProfileByIdentity($identity: Identity) {
    Socials(
      input: {
        filter: { dappName: { _eq: farcaster }, identity: { _eq: $identity } }
        blockchain: ethereum
      }
    ) {
      Social {
        profileName
        profileDisplayName
        profileImageContentValue {
          image {
            extraSmall
          }
        }
        userId
      }
    }
  }
`;

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
