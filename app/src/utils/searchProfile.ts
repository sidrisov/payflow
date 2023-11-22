import axios from 'axios';
import { MetaType, ProfileType, ProfileWithSocialsType, SocialInfoType } from '../types/ProfleType';
import { fetchQuery } from '@airstack/airstack-react';
import { isAddress } from 'viem';
import { API_URL } from './urlConstants';

export const querySocials = `query GetSocial($identity: Identity!) {
  Wallet(input: {identity: $identity, blockchain: ethereum}) {
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
    socials(input: {limit: 5}) {
      dappName
      profileName
      profileImage
      profileTokenId
    }
    xmtp {
      isXMTPEnabled
    }
  }
}`;

export const querySocialsMinimal = `query GetSocial($identity: Identity!) {
  Wallet(input: {identity: $identity, blockchain: ethereum}) {
    primaryDomain {
      name
    }
    socials(input: {limit: 5}) {
      dappName
      profileName
    }
    xmtp {
      isXMTPEnabled
    }
  }
}`;

const queryAssociatedAddressesByFarcasterName = `query GetAssociatedAddresses($profileName: String!) {
  Socials(
    input: {filter: {dappName: {_eq: farcaster}, profileName: {_eq: $profileName}}, blockchain: ethereum}
  ) {
    Social {
      userAssociatedAddresses
    }
  }
}`;

const queryAssociatedAddressesByLensName = `query GetAssociatedAddresses($profileName: String!) {
  Socials(
    input: {filter: {dappName: {_eq: lens}, profileName: {_eq: $profileName}}, blockchain: ethereum}
  ) {
    Social {
      userAssociatedAddresses
    }
  }
}`;

const ENS_SCORE = 3;
const FARCASTER_SCORE = 4;
const LENS_SCORE = 4;
const XMTP_SCORE = 1;

export function sortBySocialScore(
  profilesWithSocials: ProfileWithSocialsType[]
): ProfileWithSocialsType[] {
  return profilesWithSocials.sort((left, right) => calculateScore(right) - calculateScore(left));
}

function calculateScore(profilesWithSocials: ProfileWithSocialsType): number {
  let score = 0;
  if (profilesWithSocials.meta) {
    if (profilesWithSocials.meta.ens) {
      score += ENS_SCORE;
    }

    if (profilesWithSocials.meta.xmtp) {
      score += XMTP_SCORE;
    }

    profilesWithSocials.meta.socials.forEach((s) => {
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

export async function searchProfile(searchValue: string): Promise<ProfileWithSocialsType[]> {
  let foundProfiles: ProfileWithSocialsType[] = [];

  if (!searchValue.includes(':') && !searchValue.includes('.') && !isAddress(searchValue)) {
    const response = await axios.get(`${API_URL}/api/user?search=${searchValue}`, {
      withCredentials: true
    });
    const profiles = (await response.data) as ProfileType[];
    if (profiles) {
      foundProfiles = foundProfiles.concat(
        ...(await Promise.all(
          profiles.filter((p) => p.defaultFlow).map((p) => searchProfile(p.address))
        ))
      );
    }
  } else if (searchValue.startsWith('fc:')) {
    const { data, error } = await fetchQuery(
      queryAssociatedAddressesByFarcasterName,
      { profileName: searchValue.substring(searchValue.indexOf(':') + 1) },
      {
        cache: true
      }
    );

    console.log('fc', data);
    if (data) {
      // TODO: optimize and fetch in batch
      foundProfiles = foundProfiles.concat(
        ...(await Promise.all(
          data.Socials && data.Socials.Social && data.Socials.Social.length > 0
            ? (data.Socials.Social[0].userAssociatedAddresses as string[]).map((address) =>
                searchProfile(address)
              )
            : []
        ))
      );
    }
  } else if (searchValue.startsWith('lens:')) {
    const { data, error } = await fetchQuery(
      queryAssociatedAddressesByLensName,
      { profileName: 'lens/@'.concat(searchValue.substring(searchValue.indexOf(':') + 1)) },
      {
        cache: true
      }
    );

    console.log('lens', data);

    if (
      data &&
      data.Socials &&
      data.Socials.Social &&
      data.Socials.Social[0].userAssociatedAddresses[0]
    ) {
      foundProfiles = foundProfiles.concat(
        await searchProfile((data.Socials.Social[0].userAssociatedAddresses as string[])[0])
      );
    }
  } else if (
    searchValue.endsWith('.eth') ||
    isAddress(searchValue) ||
    searchValue.endsWith('.xyz')
  ) {
    const { data, error } = await fetchQuery(
      querySocials,
      { identity: searchValue },
      {
        cache: true
      }
    );

    const meta = converSocialResults(data);

    if (meta && meta.addresses[0]) {
      const response = await axios.get(`${API_URL}/api/user/${data.Wallet.addresses[0]}`, {
        withCredentials: true
      });
      const profile = (await response.data) as ProfileType;
      if (profile) {
        foundProfiles.push({ profile: profile, meta: meta });
      } else {
        foundProfiles.push({ meta: meta });
      }
    }
  }

  console.log('found profiles', foundProfiles);

  return foundProfiles;
}

function converSocialResults(data: any): MetaType | undefined {
  if (!data || !data.Wallet) {
    return;
  }

  let meta = {} as MetaType;

  if (data.Wallet.addresses) {
    meta.addresses = data.Wallet.addresses;
  } else {
    meta.addresses = [];
  }

  if (data.Wallet.primaryDomain) {
    meta.ens = data.Wallet.primaryDomain.name;
  }

  if (data.Wallet.socials) {
    meta.socials = data.Wallet.socials
      .filter((s: any) => s.dappName && s.profileName && s.profileImage)
      .map(
        (s: any) =>
          ({
            dappName: s.dappName,
            profileName: s.profileName,
            profileImage: s.profileImage
          } as SocialInfoType)
      );
  } else {
    meta.socials = [];
  }

  console.log(data);
  if (data.Wallet.primaryDomain && data.Wallet.primaryDomain.tokenNft) {
    meta.ensAvatar = data.Wallet.primaryDomain.tokenNft.contentValue?.image?.small;
  }

  if (!meta.ensAvatar && meta.socials.length > 0) {
    meta.ensAvatar = meta.socials[0].profileImage;
  }

  if (data.Wallet.xmtp && data.Wallet.xmtp[0].isXMTPEnabled) {
    meta.xmtp = true;
  } else {
    meta.xmtp = false;
  }

  return meta;
}
