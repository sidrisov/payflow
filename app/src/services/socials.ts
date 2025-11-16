import { MetaType, ContactType, SocialInfoType } from '@payflow/common';
import { Address, isAddress } from 'viem';
import { FARCASTER_DAPP } from '../utils/dapps';
import { getProfileByAddressOrName, searchByListOfAddressesOrUsernames } from './user';
import { Wallet } from '../generated/graphql/types';
import { getPublicClient } from 'wagmi/actions';
import { wagmiConfig } from '../utils/wagmiConfig';
import { degen } from 'viem/chains';
import { fetchSocialInfo } from '@/utils/hooks/useSocials';

const ENS_SCORE = 5;
const FARCASTER_SCORE = 4;
const LENS_SCORE = 4;

export function sortBySocialScore(identities: ContactType[]): ContactType[] {
  return identities.sort((left, right) => calculateScore(right) - calculateScore(left));
}

function calculateScore(identity: ContactType): number {
  let score = 0;
  if (identity.data.meta) {
    if (identity.data.meta.ens) {
      score += ENS_SCORE;
    }

    identity.data.meta.socials?.forEach((s) => {
      if (s.dappName === 'farcaster') {
        score += FARCASTER_SCORE;
      }

      if (s.dappName === 'lens') {
        score += LENS_SCORE;
      }
    });
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
  // Social handle search currently disabled - returns empty results
  return [];
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

  const data = await fetchSocialInfo(identity);

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
            profileId: s.userId ?? -1
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

  return { data: { meta, address: wallet.addresses?.[0] ?? '0x' } } as ContactType;
}

export function normalizeUsername(username: string) {
  return username
    .replace('.eth', '')
    .replace('.cb.id', '')
    .replace('.xyz', '')
    .replace('.degen', '');
}
