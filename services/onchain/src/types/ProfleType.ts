import { Address } from 'viem';

export interface ProfileType {
  identity: Address;
  displayName?: string;
  username?: string;
  profileImage?: string;
  preferredTokens?: string[];
}

export interface SocialInfoType {
  dappName: string;
  profileName: string;
  profileDisplayName: string;
  profileImage: string;
  followerCount: number;
}

export interface MetaType {
  ens?: string;
  ensAvatar?: string;
  socials: SocialInfoType[];
}

export interface IdentityType {
  address: Address;
  profile?: ProfileType;
  meta?: MetaType;
}
