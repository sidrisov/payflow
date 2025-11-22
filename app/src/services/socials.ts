import { MetaType, ContactType } from '@payflow/common';
import { isAddress } from 'viem';
import { getProfileByAddressOrName, searchByListOfAddressesOrUsernames } from './user';

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
async function searchBySocialHandle(_searchValue: string, _me?: string): Promise<ContactType[]> {
  // Airstack service is no longer supported - returns empty results
  return [];
}

// Helper function for domain/address search
async function searchByDomainOrAddress(_searchValue: string, _me?: string): Promise<ContactType[]> {
  // Airstack service is no longer supported - returns empty results
  return [];
}


export function normalizeUsername(username: string) {
  return username
    .replace('.eth', '')
    .replace('.cb.id', '')
    .replace('.xyz', '')
    .replace('.degen', '');
}
