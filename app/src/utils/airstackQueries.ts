export const QUERY_SOCIALS_INSIGHTS = /* GraphQL */ `
  query GetSocialsInsights($identity: Identity!, $me: Identity!) {
    Wallet(input: { identity: $identity }) {
      addresses
      primaryDomain {
        name
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
      }
      socialFollowers(input: { filter: { identity: { _eq: $me }, dappName: { _eq: farcaster } } }) {
        Follower {
          dappName
        }
      }
      socialFollowings(
        input: { filter: { identity: { _eq: $me }, dappName: { _eq: farcaster } } }
      ) {
        Following {
          dappName
        }
      }
    }
  }
`;

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
            userAddress
            userId
          }
          socialFollowers(
            input: { filter: { identity: { _eq: $me }, dappName: { _eq: farcaster } } }
          ) {
            Follower {
              dappName
            }
          }
          socialFollowings(
            input: { filter: { identity: { _eq: $me }, dappName: { _eq: farcaster } } }
          ) {
            Following {
              dappName
            }
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
            userAddress
            userId
          }
        }
      }
    }
  }
`;

export const QUERY_SOCIALS_INSIGHTS_LIGHT = /* GraphQL */ `
  query GetSocialsInsightsLight($identity: Identity!, $me: Identity!) {
    Wallet(input: { identity: $identity }) {
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
      }
      socialFollowers(input: { filter: { identity: { _eq: $me }, dappName: { _eq: farcaster } } }) {
        Follower {
          dappName
        }
      }
      socialFollowings(
        input: { filter: { identity: { _eq: $me }, dappName: { _eq: farcaster } } }
      ) {
        Following {
          dappName
        }
      }
    }
  }
`;

export const QUERY_SOCIALS_LIGHT = /* GraphQL */ `
  query GetSocialsLight($identity: Identity!) {
    Wallet(input: { identity: $identity }) {
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
        userId
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

export const QUERY_MOXIE_REWARDS = `
  query FarcasterUserClaimTransactionDetails($fid: Int!) {
    FarcasterUserClaimTransactionDetails(input: { fid: $fid }) {
      fid
      availableClaimAmount
      minimumClaimableAmountInWei
      availableClaimAmountInWei
      claimedAmount
      claimedAmountInWei
      processingAmount
      processingAmountInWei
    }
  }
`;

export const QUERY_CLAIM_MOXIE_REWARDS = `
  mutation FarcasterUserClaimMoxie($fid: Int!, $preferredConnectedWallet: String!) {
    FarcasterUserClaimMoxie(
      input: {fid: $fid, preferredConnectedWallet: $preferredConnectedWallet}
    ) {
      fid
      availableClaimAmount
      minimumClaimableAmountInWei
      availableClaimAmountInWei
      claimedAmount
      claimedAmountInWei
      processingAmount
      processingAmountInWei
      tokenAddress
      chainId
      transactionId
      transactionStatus
      transactionAmount
      transactionAmountInWei
      rewardsLastEarnedTimestamp
    }
  }
`;

export const QUERY_CHECK_STATUS_CLAIM_MOXIE_REWARDS = `
  query FarcasterUserClaimTransactionDetails($fid: Int!, $transactionId: String) {
    FarcasterUserClaimTransactionDetails(
      input: {fid: $fid, transactionId: $transactionId}
    ) {
      transactionId
      transactionStatus
      transactionAmount
      transactionAmountInWei
      rewardsLastEarnedTimestamp
    }
  }
`;
