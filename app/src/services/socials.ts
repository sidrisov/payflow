import { MetaType, ContactType, SocialInfoType, InsightsType } from '../types/ProfleType';
import { fetchQuery } from '@airstack/airstack-react';
import { Address, isAddress } from 'viem';
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
import axios from 'axios';
import { BaseNameReponseType } from '../types/BaseNameType';
import { getPublicClient } from 'wagmi/actions';
import { privyWagmiConfig } from '../utils/wagmiConfig';
import { degen } from 'viem/chains';

const FOLLOWING = 7;
const FOLLOWER = 3;
const TRANSACTED_BASE = 10;
const PER_TRANSACTION = 1;

const ENS_SCORE = 5;
const FARCASTER_SCORE = 4;
const LENS_SCORE = 4;
const XMTP_SCORE = 2;

export function sortBySocialScore(identities: ContactType[]): ContactType[] {
  return identities.sort((left, right) => calculateScore(right) - calculateScore(left));
}

function calculateScore(identity: ContactType): number {
  let score = 0;
  if (identity.data.meta) {
    if (identity.data.meta.ens) {
      score += ENS_SCORE;
    }

    if (identity.data.meta.xmtp) {
      score += XMTP_SCORE;
    }

    identity.data.meta.socials?.forEach((s) => {
      if (s.dappName === 'farcaster') {
        score += FARCASTER_SCORE;
      }

      if (s.dappName === 'lens') {
        score += LENS_SCORE;
      }
    });

    if (identity.data.meta.insights) {
      if (identity.data.meta.insights.farcasterFollow === 'following') {
        score += FOLLOWING;
      }

      if (identity.data.meta.insights.farcasterFollow === 'mutual') {
        score += FOLLOWING + FOLLOWER;
      }

      if (identity.data.meta.insights.lensFollow === 'following') {
        score += FOLLOWING;
      }

      if (identity.data.meta.insights.lensFollow === 'mutual') {
        score += FOLLOWING + FOLLOWER;
      }

      if (identity.data.meta.insights.sentTxs > 0) {
        score += TRANSACTED_BASE + identity.data.meta.insights.sentTxs * PER_TRANSACTION;
      }
    }
  }
  return score;
}

export async function searchIdentity(searchValue: string, me?: string): Promise<ContactType[]> {
  let foundProfiles: ContactType[] = [];

  if (!searchValue.includes('@') && !searchValue.includes('.') && !isAddress(searchValue)) {
    const profiles = await searchByListOfAddressesOrUsernames([searchValue]);
    if (profiles) {
      foundProfiles = foundProfiles.concat(
        ...(await Promise.all(
          profiles.filter((p) => p.defaultFlow).map((p) => searchIdentity(p.identity, me))
        ))
      );
    }
  } else if (searchValue.startsWith('@') || searchValue.startsWith('lens:')) {
    const dappName = searchValue.startsWith('@') ? FARCASTER_DAPP : LENS_DAPP;
    const profileName = searchValue.startsWith('@')
      ? searchValue.substring(searchValue.indexOf('@') + 1)
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
        let userAssociatedIdentities: ContactType[] = [];

        dataInBatch.Socials.Social.forEach((social: any) => {
          console.log(social);
          social.userAssociatedAddressDetails
            // remove solana addresses
            .filter((userAssociatedAddress: any) => isAddress(userAssociatedAddress.addresses[0]))
            .forEach((userAssociatedAddress: any) => {
              const identity = convertSocialResults(userAssociatedAddress);
              if (identity) {
                userAssociatedIdentities.push(identity);
              }
            });
        });

        console.log('userAssociatedIdentities', userAssociatedIdentities);

        const addresses = userAssociatedIdentities.map((identity) => identity.data.address);

        // TODO, make meta not nullable
        const profiles = await searchByListOfAddressesOrUsernames(addresses as string[]);
        userAssociatedIdentities.forEach((identity) => {
          const profile = profiles.find(
            (p) => p.identity.toLowerCase() === identity.data.address.toLowerCase()
          );
          identity.data.profile = profile;
          foundProfiles.push(identity);
        });
      }
    }
  } else if (
    searchValue.endsWith('.eth') ||
    isAddress(searchValue) ||
    searchValue.endsWith('.xyz') ||
    searchValue.endsWith('.id') ||
    searchValue.endsWith('.base') ||
    searchValue.endsWith('.degen')
  ) {
    let identity = searchValue;
    if (searchValue.endsWith('.base')) {
      const response = await axios.get(`https://resolver-api.basename.app/v1/names/${searchValue}`);
      const basename = response.data as BaseNameReponseType;
      if (basename.address) {
        identity = basename.address;
      } else {
        return foundProfiles;
      }
    }

    if (searchValue.endsWith('.degen')) {
      const publicClient = getPublicClient(privyWagmiConfig, { chainId: degen.id });

      if (publicClient) {
        const degenDomainHolderAddress = await publicClient.readContract({
          address: '0x4087fb91A1fBdef05761C02714335D232a2Bf3a1',
          abi: [
            {
              inputs: [{ name: '_domainName', type: 'string' }],
              name: 'getDomainHolder',
              outputs: [{ name: '', type: 'address' }],
              stateMutability: 'view',
              type: 'function'
            }
          ],
          functionName: 'getDomainHolder',
          args: [searchValue.replace('.degen', '')]
        });

        if (degenDomainHolderAddress) {
          identity = degenDomainHolderAddress as Address;
        } else {
          return foundProfiles;
        }
      }
    }

    const { data } = me
      ? await fetchQuery<GetSocialsInsightsQuery>(
          QUERY_SOCIALS_INSIGHTS,
          { identity, me },
          {
            cache: true
          }
        )
      : await fetchQuery<GetSocialsQuery>(
          QUERY_SOCIALS,
          { identity },
          {
            cache: true
          }
        );

    if (data && data.Wallet) {
      const identity = convertSocialResults(data.Wallet as unknown as Wallet);

      if (identity) {
        const profile = await getProfileByAddressOrName(identity.data.address);
        identity.data.profile = profile;
        foundProfiles.push(identity);
      }
    }
  }

  console.debug('Found profiles:', foundProfiles);

  return foundProfiles;
}

export function convertSocialResults(wallet: Wallet): ContactType | undefined {
  console.debug('Converting wallet info: ', wallet);

  let meta: MetaType = {} as MetaType;

  if (wallet.primaryDomain) {
    meta.ens = wallet.primaryDomain.name as string;
  } else if (wallet.domains && wallet.domains.length > 0) {
    meta.ens = wallet.domains[0].name as string;
  }

  if (wallet.socials) {
    meta.socials = wallet.socials
      .filter(
        (s: any) =>
          s.dappName &&
          s.profileName &&
          (s.dappName !== FARCASTER_DAPP || s.userAddress !== wallet.addresses?.[0])
      )
      .map(
        (s: any) =>
          ({
            dappName: s.dappName,
            profileName: s.profileName,
            profileDisplayName: s.profileDisplayName,
            profileImage: s.profileImageContentValue?.image?.small ?? s.profileImage,
            followerCount: s.followerCount,
            isFarcasterPowerUser: s.isFarcasterPowerUser
          } as SocialInfoType)
      )
      .sort((a, b) => b.followerCount - a.followerCount);

    const result = wallet.socials.reduce(
      (acc, s) => {
        if (
          !s.dappName ||
          !s.profileName ||
          (s.dappName === FARCASTER_DAPP && s.userAddress === wallet.addresses?.[0])
        ) {
          acc.valid = false;
        } else {
          acc.socials.push({
            dappName: s.dappName,
            profileName: s.profileName,
            profileDisplayName: s.profileDisplayName,
            profileImage: s.profileImageContentValue?.image?.small ?? s.profileImage,
            followerCount: s.followerCount,
            isFarcasterPowerUser: s.isFarcasterPowerUser
          } as SocialInfoType);
        }
        return acc;
      },
      { socials: [] as SocialInfoType[], valid: true }
    );

    if (!result.valid) {
      return;
    }

    meta.socials = result.socials.sort((a, b) => b.followerCount - a.followerCount);
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

  return { data: { meta, address: wallet.addresses?.[0] ?? '0x' } } as ContactType;
}

export function normalizeUsername(username: string) {
  return username
    .replace('.eth', '')
    .replace('.cb.id', '')
    .replace('.xyz', '')
    .replace('.base', '')
    .replace('.degen', '');
}
