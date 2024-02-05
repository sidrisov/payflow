export const QUERY_SOCIALS_INSIGHTS = /* GraphQL */ `
  query GetSocialsInsights($identity: Identity!, $me: Identity!) {
    Wallet(input: { identity: $identity, blockchain: ethereum }) {
      addresses
      primaryDomain {
        name
        tokenNft {
          contentValue {
            image {
              small
            }
          }
        }
      }
      domains(input: { limit: 1 }) {
        name
      }
      socials(input: { limit: 5 }) {
        dappName
        profileName
        profileDisplayName
        profileImage
        profileImageContentValue {
          image {
            small
          }
        }
        followerCount
      }
      xmtp {
        isXMTPEnabled
      }
      socialFollowers(
        input: { filter: { identity: { _eq: $me }, dappName: { _in: [farcaster, lens] } } }
      ) {
        Follower {
          dappName
        }
      }
      socialFollowings(
        input: { filter: { identity: { _eq: $me }, dappName: { _in: [farcaster, lens] } } }
      ) {
        Following {
          dappName
        }
      }
      ethTransfers: tokenTransfers(
        input: { limit: 6, filter: { from: { _eq: $me } }, blockchain: ethereum }
      ) {
        type
      }
      baseTransfers: tokenTransfers(
        input: { limit: 6, filter: { from: { _eq: $me } }, blockchain: base }
      ) {
        type
      }
    }
  }
`;

export const QUERY_SOCIALS = /* GraphQL */ `
  query GetSocials($identity: Identity!) {
    Wallet(input: { identity: $identity, blockchain: ethereum }) {
      addresses
      primaryDomain {
        name
        tokenNft {
          contentValue {
            image {
              small
            }
          }
        }
      }
      domains(input: { limit: 1 }) {
        name
      }
      socials(input: { limit: 5 }) {
        dappName
        profileName
        profileDisplayName
        profileImage
        profileImageContentValue {
          image {
            small
          }
        }
        followerCount
      }
      xmtp {
        isXMTPEnabled
      }
    }
  }
`;

export const QUERY_SOCIALS_INSIGHTS_IN_BATCH_FOR_ASSOCIATED_ADDRESSES_BY_PROFILE_NAME = /* GraphQL */ `
  query GetSocialsInsightsForAssociatedAddresses(
    $dappName: SocialDappName!
    $profileName: String!
    $me: Identity!
  ) {
    Socials(
      input: {
        limit: 10
        filter: { dappName: { _eq: $dappName }, profileName: { _regex: $profileName } }
        blockchain: ethereum
        order: { followerCount: DESC }
      }
    ) {
      Social {
        userAssociatedAddressDetails {
          addresses
          primaryDomain {
            name
            tokenNft {
              contentValue {
                image {
                  small
                }
              }
            }
          }
          domains(input: { limit: 1 }) {
            name
          }
          socials(input: { limit: 5 }) {
            userAssociatedAddresses
            dappName
            profileName
            profileDisplayName
            profileImage
            profileImageContentValue {
              image {
                small
              }
            }
            followerCount
          }
          xmtp {
            isXMTPEnabled
          }
          socialFollowers(
            input: { filter: { identity: { _eq: $me }, dappName: { _in: [farcaster, lens] } } }
          ) {
            Follower {
              dappName
            }
          }
          socialFollowings(
            input: { filter: { identity: { _eq: $me }, dappName: { _in: [farcaster, lens] } } }
          ) {
            Following {
              dappName
            }
          }
          ethTransfers: tokenTransfers(
            input: { limit: 6, filter: { from: { _eq: $me } }, blockchain: ethereum }
          ) {
            type
          }
          baseTransfers: tokenTransfers(
            input: { limit: 6, filter: { from: { _eq: $me } }, blockchain: base }
          ) {
            type
          }
        }
      }
    }
  }
`;

export const QUERY_SOCIALS_IN_BATCH_FOR_ASSOCIATED_ADDRESSES_BY_PROFILE_NAME = /* GraphQL */ `
  query GetSocialsForAssociatedAddresses($dappName: SocialDappName!, $profileName: String!) {
    Socials(
      input: {
        limit: 10
        filter: { dappName: { _eq: $dappName }, profileName: { _regex: $profileName } }
        blockchain: ethereum
        order: { followerCount: DESC }
      }
    ) {
      Social {
        userAssociatedAddressDetails {
          addresses
          primaryDomain {
            name
            tokenNft {
              contentValue {
                image {
                  small
                }
              }
            }
          }
          domains(input: { limit: 1 }) {
            name
          }
          socials(input: { limit: 5 }) {
            userAssociatedAddresses
            dappName
            profileName
            profileDisplayName
            profileImage
            profileImageContentValue {
              image {
                small
              }
            }
            followerCount
          }
          xmtp {
            isXMTPEnabled
          }
        }
      }
    }
  }
`;

export const QUERY_SOCIALS_INSIGHTS_LIGHT = /* GraphQL */ `
  query GetSocialsLight($identity: Identity!, $me: Identity!) {
    Wallet(input: { identity: $identity, blockchain: ethereum }) {
      primaryDomain {
        name
      }
      domains(input: { limit: 1 }) {
        name
      }
      socials(input: { limit: 5 }) {
        dappName
        profileName
        followerCount
      }
      xmtp {
        isXMTPEnabled
      }
      socialFollowers(
        input: { filter: { identity: { _eq: $me }, dappName: { _in: [farcaster, lens] } } }
      ) {
        Follower {
          dappName
        }
      }
      socialFollowings(
        input: { filter: { identity: { _eq: $me }, dappName: { _in: [farcaster, lens] } } }
      ) {
        Following {
          dappName
        }
      }
      ethTransfers: tokenTransfers(
        input: { limit: 6, filter: { from: { _eq: $me } }, blockchain: ethereum }
      ) {
        type
      }
      baseTransfers: tokenTransfers(
        input: { limit: 6, filter: { from: { _eq: $me } }, blockchain: base }
      ) {
        type
      }
    }
  }
`;

export const QUERY_SOCIALS_LIGHT = /* GraphQL */ `
  query GetSocialsLight($identity: Identity!) {
    Wallet(input: { identity: $identity, blockchain: ethereum }) {
      primaryDomain {
        name
      }
      domains(input: { limit: 1 }) {
        name
      }
      socials(input: { limit: 5 }) {
        dappName
        profileName
        followerCount
      }
      xmtp {
        isXMTPEnabled
      }
    }
  }
`;
