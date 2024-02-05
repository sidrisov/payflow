import { MetaType, IdentityType, SocialInfoType, InsightsType } from '../types/ProfleType';
import { fetchQuery } from '@airstack/airstack-react';
import { isAddress } from 'viem';
import { FARCASTER_DAPP, LENS_DAPP } from '../utils/dapps';
import { getProfileByAddressOrName, searchByListOfAddressesOrUsernames } from './user';
import {
  GetSocialsForAssociatedAddressesQuery,
  Wallet,
  GetSocialsQuery,
  GetSocialsInsightsForAssociatedAddressesQuery,
  GetSocialsInsightsQuery
} from '../generated/graphql/types';
import {
  QUERY_SOCIALS_INSIGHTS_IN_BATCH_FOR_ASSOCIATED_ADDRESSES_BY_PROFILE_NAME,
  QUERY_SOCIALS_IN_BATCH_FOR_ASSOCIATED_ADDRESSES_BY_PROFILE_NAME,
  QUERY_SOCIALS_INSIGHTS,
  QUERY_SOCIALS
} from '../utils/airstackQueries';

const FOLLOWING = 7;
const FOLLOWER = 3;
const TRANSACTED_BASE = 10;
const PER_TRANSACTION = 1;

const ENS_SCORE = 5;
const FARCASTER_SCORE = 4;
const LENS_SCORE = 4;
const XMTP_SCORE = 2;

export function sortBySocialScore(identities: IdentityType[]): IdentityType[] {
  return identities.sort((left, right) => calculateScore(right) - calculateScore(left));
}

function calculateScore(identity: IdentityType): number {
  let score = 0;
  if (identity.meta) {
    if (identity.meta.ens) {
      score += ENS_SCORE;
    }

    if (identity.meta.xmtp) {
      score += XMTP_SCORE;
    }

    identity.meta.socials?.forEach((s) => {
      if (s.dappName === 'farcaster') {
        score += FARCASTER_SCORE;
      }

      if (s.dappName === 'lens') {
        score += LENS_SCORE;
      }
    });

    if (identity.meta.insights) {
      if (identity.meta.insights.farcasterFollow === 'following') {
        score += FOLLOWING;
      }

      if (identity.meta.insights.farcasterFollow === 'mutual') {
        score += FOLLOWING + FOLLOWER;
      }

      if (identity.meta.insights.lensFollow === 'following') {
        score += FOLLOWING;
      }

      if (identity.meta.insights.lensFollow === 'mutual') {
        score += FOLLOWING + FOLLOWER;
      }

      if (identity.meta.insights.sentTxs > 0) {
        score += TRANSACTED_BASE + identity.meta.insights.sentTxs * PER_TRANSACTION;
      }
    }
  }
  return score;
}

export async function searchIdentity(searchValue: string, me?: string): Promise<IdentityType[]> {
  let foundProfiles: IdentityType[] = [];

  if (!searchValue.includes(':') && !searchValue.includes('.') && !isAddress(searchValue)) {
    const profiles = await searchByListOfAddressesOrUsernames([searchValue]);
    if (profiles) {
      foundProfiles = foundProfiles.concat(
        ...(await Promise.all(
          profiles.filter((p) => p.defaultFlow).map((p) => searchIdentity(p.identity, me))
        ))
      );
    }
  } else if (searchValue.startsWith('fc:') || searchValue.startsWith('lens:')) {
    const dappName = searchValue.startsWith('fc:') ? FARCASTER_DAPP : LENS_DAPP;
    const profileName = searchValue.startsWith('fc:')
      ? searchValue.substring(searchValue.indexOf(':') + 1)
      : 'lens/@'.concat(searchValue.substring(searchValue.indexOf(':') + 1));

    if (profileName.length > 0) {
      const { data: dataInBatch } = me
        ? await fetchQuery<GetSocialsInsightsForAssociatedAddressesQuery>(
            QUERY_SOCIALS_INSIGHTS_IN_BATCH_FOR_ASSOCIATED_ADDRESSES_BY_PROFILE_NAME,
            {
              dappName,
              profileName: '^'.concat(profileName.toLowerCase()),
              me
            },
            {
              cache: true
            }
          )
        : await fetchQuery<GetSocialsForAssociatedAddressesQuery>(
            QUERY_SOCIALS_IN_BATCH_FOR_ASSOCIATED_ADDRESSES_BY_PROFILE_NAME,
            {
              dappName,
              profileName: '^'.concat(profileName.toLowerCase())
            },
            {
              cache: true
            }
          );

      if (
        dataInBatch &&
        dataInBatch.Socials &&
        dataInBatch.Socials.Social &&
        dataInBatch.Socials.Social.length > 0
      ) {
        let userAssociatedIdentities: IdentityType[] = [];

        dataInBatch.Socials.Social.forEach((social: any) => {
          console.log(social);

          social.userAssociatedAddressDetails.forEach((s: any) => {
            const identity = convertSocialResults(s);
            if (identity) {
              userAssociatedIdentities.push(identity);
            }
          });
        });

        console.log('userAssociatedIdentities', userAssociatedIdentities);

        const addresses = userAssociatedIdentities.map((identity) => identity.address);

        // TODO, make meta not nullable
        const profiles = await searchByListOfAddressesOrUsernames(addresses as string[]);
        userAssociatedIdentities.forEach((identity) => {
          const profile = profiles.find(
            (p) => p.identity.toLowerCase() === identity.address.toLowerCase()
          );
          identity.profile = profile;
          foundProfiles.push(identity);
        });
      }
    }
  } else if (
    searchValue.endsWith('.eth') ||
    isAddress(searchValue) ||
    searchValue.endsWith('.xyz') ||
    searchValue.endsWith('.id')
  ) {
    const { data } = me
      ? await fetchQuery<GetSocialsInsightsQuery>(
          QUERY_SOCIALS_INSIGHTS,
          { identity: searchValue, me },
          {
            cache: true
          }
        )
      : await fetchQuery<GetSocialsQuery>(
          QUERY_SOCIALS,
          { identity: searchValue },
          {
            cache: true
          }
        );

    if (data && data.Wallet) {
      const identity = convertSocialResults(data.Wallet as unknown as Wallet);

      if (identity) {
        const profile = await getProfileByAddressOrName(identity.address);
        identity.profile = profile;
        foundProfiles.push(identity);
      }
    }
  }

  console.debug('Found profiles:', foundProfiles);

  return foundProfiles;
}

export function convertSocialResults(wallet: Wallet): IdentityType {
  console.debug('Converting wallet info: ', wallet);

  let meta: MetaType = {} as MetaType;

  if (wallet.primaryDomain) {
    meta.ens = wallet.primaryDomain.name as string;
  } else if (wallet.domains && wallet.domains.length > 0) {
    meta.ens = wallet.domains[0].name as string;
  }

  if (wallet.socials) {
    meta.socials = wallet.socials
      .filter((s: any) => s.dappName && s.profileName)
      .map(
        (s: any) =>
          ({
            dappName: s.dappName,
            profileName: s.profileName,
            profileDisplayName: s.profileDisplayName,
            profileImage: s.profileImageContentValue?.image?.small ?? s.profileImage,
            followerCount: s.followerCount
          } as SocialInfoType)
      );
  } else {
    meta.socials = [];
  }

  if (wallet.primaryDomain && wallet.primaryDomain.tokenNft) {
    meta.ensAvatar = wallet.primaryDomain.tokenNft.contentValue?.image?.small as string;
  }

  if (!meta.ensAvatar && meta.socials.length > 0) {
    meta.ensAvatar = meta.socials[0].profileImage;
  }

  if (wallet.xmtp && wallet.xmtp[0].isXMTPEnabled) {
    meta.xmtp = true;
  } else {
    meta.xmtp = false;
  }

  meta.insights = {} as InsightsType;

  if (wallet.socialFollowers && wallet.socialFollowings && wallet.socialFollowings.Following) {
    if (wallet.socialFollowings.Following?.find((f: any) => f.dappName === FARCASTER_DAPP)) {
      if (wallet.socialFollowers.Follower?.find((f: any) => f.dappName === FARCASTER_DAPP)) {
        meta.insights.farcasterFollow = 'mutual';
      } else {
        meta.insights.farcasterFollow = 'following';
      }
    }

    if (wallet.socialFollowings.Following?.find((f: any) => f.dappName === LENS_DAPP)) {
      if (wallet.socialFollowers.Follower?.find((f: any) => f.dappName === LENS_DAPP)) {
        meta.insights.lensFollow = 'mutual';
      } else {
        meta.insights.lensFollow = 'following';
      }
    }
  }

  if (wallet.tokenTransfers && wallet.tokenTransfers.length > 0) {
    meta.insights.sentTxs = wallet.tokenTransfers.length;
  }

  // @ts-ignore
  if ((wallet.ethTransfers as any) && wallet.ethTransfers.length > 0) {
    // @ts-ignore
    meta.insights.sentTxs = wallet.ethTransfers.length;
  }

  // @ts-ignore
  if (wallet.baseTransfers && wallet.baseTransfers.length > 0) {
    // @ts-ignore
    meta.insights.sentTxs = (meta.insights.sentTxs ?? 0) + wallet.baseTransfers.length;
  }

  return { meta, address: wallet.addresses?.[0] ?? '0x' } as IdentityType;
}
