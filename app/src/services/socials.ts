import { MetaType, ContactType, SocialInfoType, InsightsType } from '@payflow/common';
import { Address, isAddress } from 'viem';
import { FARCASTER_DAPP, LENS_DAPP } from '../utils/dapps';
import { getProfileByAddressOrName, searchByListOfAddressesOrUsernames } from './user';
import { GetSocialsQuery, Wallet } from '../generated/graphql/types';
import { getPublicClient } from 'wagmi/actions';
import { wagmiConfig } from '../utils/wagmiConfig';
import { degen } from 'viem/chains';
import { fetchQuery } from '@airstack/airstack-react';
import { QUERY_SOCIALS } from '../utils/airstackQueries';

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
  const searchPromises: Promise<ContactType[]>[] = [];

  // First search option: direct profile name search
  if (!searchValue.includes('.') && !isAddress(searchValue)) {
    searchPromises.push(searchByUsername(searchValue, me));
  }

  // Second search option: social username search
  searchPromises.push(searchBySocialHandle(searchValue, me));

  // Execute parallel searches first
  const searchResults = await Promise.all(searchPromises);
  let foundProfiles: ContactType[] = searchResults.flat();

  // Third search option: domain/address search (keep sequential due to conditional logic)
  if (
    searchValue.endsWith('.eth') ||
    isAddress(searchValue) ||
    searchValue.endsWith('.xyz') ||
    searchValue.endsWith('.id') ||
    searchValue.endsWith('.degen')
  ) {
    const domainResults = await searchByDomainOrAddress(searchValue, me);
    foundProfiles = foundProfiles.concat(domainResults);
  }

  console.debug('Found profiles:', foundProfiles);
  return foundProfiles;
}

// Helper function for username search
async function searchByUsername(searchValue: string, me?: string): Promise<ContactType[]> {
  const profiles = await searchByListOfAddressesOrUsernames([searchValue]);
  if (!profiles) return [];

  const searchPromises = profiles
    .filter((p) => p.defaultFlow)
    .map((p) => searchIdentity(p.identity, me));

  const results = await Promise.all(searchPromises);
  return results.flat();
}

// Helper function for social handle search
async function searchBySocialHandle(searchValue: string, me?: string): Promise<ContactType[]> {
  const dappName = FARCASTER_DAPP;
  const profileName = searchValue;

  if (profileName.length === 0) return [];

  /* const { data: dataInBatch } = me
    ? await fetchQuery<GetSocialsInsightsForAssociatedAddressesQuery>(
        QUERY_SOCIALS_INSIGHTS_IN_BATCH_FOR_ASSOCIATED_ADDRESSES_BY_PROFILE_NAME,
        {
          dappName,
          profileName: '^'.concat(profileName.toLowerCase()),
          me
        },
        { cache: true }
      )
    : await fetchQuery<GetSocialsForAssociatedAddressesQuery>(
        QUERY_SOCIALS_IN_BATCH_FOR_ASSOCIATED_ADDRESSES_BY_PROFILE_NAME,
        {
          dappName,
          profileName: '^'.concat(profileName.toLowerCase())
        },
        { cache: true }
      );

  if (!dataInBatch?.Socials?.Social?.length) return []; */

  return [];

  /* const userAssociatedIdentities: ContactType[] = [];

  dataInBatch.Socials.Social.forEach((social: any) => {
    social.userAssociatedAddressDetails
      .filter((userAssociatedAddress: any) => isAddress(userAssociatedAddress.addresses[0]))
      .forEach((userAssociatedAddress: any) => {
        const identity = convertSocialResults(userAssociatedAddress);
        if (identity) {
          userAssociatedIdentities.push(identity);
        }
      });
  });

  const addresses = userAssociatedIdentities.map((identity) => identity.data.address);
  const profiles = await searchByListOfAddressesOrUsernames(addresses as string[]);

  userAssociatedIdentities.forEach((identity) => {
    const profile = profiles.find(
      (p) => p.identity.toLowerCase() === identity.data.address.toLowerCase()
    );
    identity.data.profile = profile;
  });

  return userAssociatedIdentities; */
}

// Helper function for domain/address search
async function searchByDomainOrAddress(searchValue: string, me?: string): Promise<ContactType[]> {
  let identity = searchValue;

  if (searchValue.endsWith('.degen')) {
    const publicClient = getPublicClient(wagmiConfig, { chainId: degen.id });
    if (!publicClient) return [];

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

    if (!degenDomainHolderAddress) return [];
    identity = degenDomainHolderAddress as Address;
  }

  const { data } = await fetchQuery<GetSocialsQuery>(QUERY_SOCIALS, { identity }, { cache: true });

  if (!data?.Wallet) return [];

  const identityResult = convertSocialResults(data.Wallet as unknown as Wallet);
  if (!identityResult) return [];

  const profile = await getProfileByAddressOrName(identityResult.data.address);
  identityResult.data.profile = profile;
  return [identityResult];
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
            profileId: s.userId
          }) as SocialInfoType
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
            profileId: s.userId
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

  if (!meta.ensAvatar && meta.socials.length > 0) {
    meta.ensAvatar = meta.socials[0].profileImage;
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
    .replace('.degen', '');
}
