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
  invited?: boolean;
  profile?: ProfileType;
  meta?: MetaType;
  tags?: string[];
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
  isFarcasterPowerUser?: boolean;
}

export interface SelectedIdentityType {
  type: 'address' | 'profile';
  identity: IdentityType;
}
