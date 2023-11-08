import { Address } from 'viem';
import { FlowType } from './FlowType';

export interface ProfileType {
  address: Address;
  displayName?: string;
  username?: string;
  profileImage?: string;
  defaultFlow?: FlowType;
}

export interface ProfileWithSocialsType {
  profile?: ProfileType;
  meta?: MetaType;
}

export interface MetaType {
  addresses: Address[];
  ens?: string;
  ensAvatar?: string;
  socials: SocialInfoType[];
  xmtp: boolean;
}

export interface SocialInfoType {
  dappName: string;
  profileName: string;
  profileImage: string;
}

export interface SelectedProfileWithSocialsType {
  type: 'address' | 'profile';
  data: ProfileWithSocialsType;
}
