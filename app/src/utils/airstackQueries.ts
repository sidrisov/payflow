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
      socials(input: { limit: 5, filter: { followerCount: { _gt: 5 } } }) {
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
        isFarcasterPowerUser
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
      socials(input: { limit: 5, filter: { followerCount: { _gt: 5 } } }) {
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
        isFarcasterPowerUser
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
        filter: {
          dappName: { _eq: $dappName }
          profileName: { _regex: $profileName }
          followerCount: { _gt: 5 }
        }
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
          socials(input: { limit: 5, filter: { followerCount: { _gt: 5 } } }) {
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
            isFarcasterPowerUser
            userAddress
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
        filter: {
          dappName: { _eq: $dappName }
          profileName: { _regex: $profileName }
          followerCount: { _gt: 5 }
        }
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
          socials(input: { limit: 5, filter: { followerCount: { _gt: 5 } } }) {
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
            isFarcasterPowerUser
            userAddress
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
  query GetSocialsInsightsLight($identity: Identity!, $me: Identity!) {
    Wallet(input: { identity: $identity, blockchain: ethereum }) {
      primaryDomain {
        name
      }
      domains(input: { limit: 1 }) {
        name
      }
      socials(input: { limit: 5, filter: { followerCount: { _gt: 5 } } }) {
        dappName
        profileName
        followerCount
        isFarcasterPowerUser
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
      socials(input: { limit: 5, filter: { followerCount: { _gt: 5 } } }) {
        dappName
        profileName
        followerCount
        isFarcasterPowerUser
      }
      xmtp {
        isXMTPEnabled
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
      }
    }
  }
`;

export const QUERY_CONTACTS_FAN_TOKENS = /* GraphQL */ `
  query GetFanTokenAuctionsForContacts(
    $statuses: [FarcasterFanTokenAuctionStatusType!]
    $entityNames: [String!]
  ) {
    FarcasterFanTokenAuctions(
      input: {
        filter: {
          status: { _in: $statuses }
          entityName: { _in: $entityNames }
          entityType: { _eq: USER }
        }
        blockchain: ALL
        order: { estimatedEndTimestamp: ASC }
        limit: 100
      }
    ) {
      FarcasterFanTokenAuction {
        auctionId
        auctionSupply
        decimals
        entityId
        entityName
        entitySymbol
        entityType
        estimatedEndTimestamp
        estimatedStartTimestamp
        launchCastUrl
        minBiddingAmount
        minFundingAmount
        minPriceInMoxie
        subjectAddress
      }
    }
  }
`;
