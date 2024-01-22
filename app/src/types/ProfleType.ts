import { Address } from 'viem';
import { FlowType } from './FlowType';

export interface ProfileType {
  identity: Address;
  signer?: Address;
  createdDate: string;
  displayName?: string;
  username?: string;
  profileImage?: string;
  defaultFlow?: FlowType;
  flows?: FlowType[];
  identityInviteLimit: number;
}

export interface IdentityType {
  address: Address;
  favouriteAddress?: boolean;
  favouriteProfile?: boolean;
  profile?: ProfileType;
  meta?: MetaType;
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
  profileImage: string;
  followerCount: number;
}

export interface SelectedIdentityType {
  type: 'address' | 'profile';
  identity: IdentityType;
}
