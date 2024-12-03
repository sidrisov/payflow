import { Address } from 'viem';
import { FlowType } from './FlowType';

export const DEFAULT_FARCASTER_CLIENT: FarcasterClient = 'WARPCAST';

export type ProfileType = {
  identity: Address;
  signer?: Address;
  createdDate: string;
  displayName?: string;
  username?: string;
  profileImage?: string;
  defaultFlow?: FlowType;
  flows?: FlowType[];
  identityInviteLimit: number;
  preferredTokens?: string[];
  preferredFarcasterClient?: FarcasterClient;
};

export type FarcasterClient = 'WARPCAST' | 'RECASTER' | 'FARQUEST';

export const FARCASTER_CLIENTS = [
  {
    id: 'warpcast',
    name: 'Warpcast',
    description: 'Official client built by Faraster team',
    url: 'https://www.warpcast.com',
    image: '/clients/warpcast.png'
  },
  {
    id: 'recaster',
    name: 'Recaster',
    description: 'Personalize your Farcaster journey',
    url: 'https://recaster.org',
    image: '/clients/recaster.png'
  },
  {
    id: 'farquest',
    name: 'Farquest',
    description: 'The best way to explore Farcaster',
    url: 'https://far.quest',
    image: '/clients/farquest.png'
  }
];

export interface IdentityType {
  address: Address;
  invited?: boolean;
  profile?: ProfileType;
  meta?: MetaType;
}

export interface ContactsResponseType {
  tags: string[];
  contacts: ContactType[];
}

export interface ContactType {
  data: IdentityType;
  tags?: string[];
}

export interface ContactWithFanTokenAuction {
  contact: ContactType;
  auction: FanTokenAuction;
}

export interface FanTokenAuction {
  farcasterUsername: String;
  estimatedStartTimestamp: Date;
  auctionSupply: number;
  launchCastUrl?: string;
}

export interface MetaType {
  ens?: string;
  ensAvatar?: string;
  socials: SocialInfoType[];
  xmtp: boolean;
  insights?: InsightsType;
}

export interface InsightsType {
  farcasterFollow: 'following' | 'mutual';
  lensFollow: 'following' | 'mutual';
  sentTxs: number;
}

export interface SocialInfoType {
  dappName: string;
  profileName: string;
  profileDisplayName: string;
  profileId: string;
  profileImage: string;
  followerCount: number;
}

export interface SelectedIdentityType {
  type: 'address' | 'profile';
  identity: IdentityType;
}
